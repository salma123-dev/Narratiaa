package com.narratiaa.auth;

import com.narratiaa.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
  private final AuthService auth; private final EmailService email; private final JdbcTemplate db; private final boolean secure;
  public AuthController(AuthService auth,EmailService email,JdbcTemplate db,@Value("${narratiaa.cookie-secure:false}")boolean secure){this.auth=auth;this.email=email;this.db=db;this.secure=secure;}
  public record EmailBody(@NotBlank @Email(message="Enter a valid email address.")String email){}
  public record VerifyBody(@NotBlank String email,@NotBlank String code){}
  public record RegisterBody(@NotBlank @Size(min=2,message="Enter at least 2 characters.")String fullName,@NotBlank @Email(message="Enter a valid email address.")String email,@NotBlank @Size(min=8,message="Use at least 8 characters.")String password,@NotBlank String confirmPassword,@NotBlank String emailVerificationToken){}
  public record LoginBody(@NotBlank String email,@NotBlank String password){}

  private ResponseCookie cookie(String value,long maxAge){return ResponseCookie.from(AuthService.COOKIE,value).httpOnly(true).secure(secure).sameSite("Strict").path("/").maxAge(maxAge).build();}
  @GetMapping("/me") public Map<String,Object> me(HttpServletRequest req){return Map.of("user",auth.requireUser(req));}
  @PostMapping("/send-verification") public Map<String,Object> send(@Valid @RequestBody EmailBody body){
    String address=auth.normalizeEmail(body.email()); if(auth.emailExists(address))throw new ApiException(HttpStatus.CONFLICT,"This email is already registered.");
    String code=auth.verificationCode(); db.update("INSERT INTO email_verifications(email,code_hash,token_hash,expires_at,verified_at,attempts,created_at) VALUES(?,?,NULL,?,NULL,0,CURRENT_TIMESTAMP) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash,token_hash=NULL,expires_at=excluded.expires_at,verified_at=NULL,attempts=0,created_at=CURRENT_TIMESTAMP",address,auth.sha256(code),OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(10));
    try{boolean dev=email.send(address,code);var out=new LinkedHashMap<String,Object>();out.put("message",dev?"Email delivery is not configured. Use this local test code:":"Verification code sent. Check your inbox and spam folder.");out.put("development",dev);if(dev)out.put("developmentCode",code);return out;}catch(RuntimeException e){db.update("DELETE FROM email_verifications WHERE email=?",address);throw e;}
  }
  @PostMapping("/verify-email") public Map<String,Object> verify(@Valid @RequestBody VerifyBody body){
    String address=auth.normalizeEmail(body.email());var rows=db.query("SELECT code_hash,expires_at,attempts FROM email_verifications WHERE email=?",(rs,n)->Map.of("hash",rs.getString(1),"expires",rs.getObject(2,OffsetDateTime.class),"attempts",rs.getInt(3)),address);
    if(rows.isEmpty()||((OffsetDateTime)rows.getFirst().get("expires")).isBefore(OffsetDateTime.now()))throw new ApiException(HttpStatus.BAD_REQUEST,"The verification code has expired. Request a new one.");
    if((int)rows.getFirst().get("attempts")>=5)throw new ApiException(HttpStatus.BAD_REQUEST,"Too many attempts. Request a new code.");
    if(!rows.getFirst().get("hash").equals(auth.sha256(body.code().trim()))){db.update("UPDATE email_verifications SET attempts=attempts+1 WHERE email=?",address);throw new ApiException(HttpStatus.BAD_REQUEST,"The verification code is incorrect.");}
    String token=UUID.randomUUID()+"-"+UUID.randomUUID();db.update("UPDATE email_verifications SET token_hash=?,verified_at=CURRENT_TIMESTAMP WHERE email=?",auth.sha256(token),address);return Map.of("message","Email verified successfully.","verificationToken",token);
  }
  @PostMapping("/register") public ResponseEntity<Map<String,Object>> register(@Valid @RequestBody RegisterBody b){
    var errors=new LinkedHashMap<String,String>();if(!b.password().matches(".*[A-Za-z].*")||!b.password().matches(".*\\d.*"))errors.put("password","Include at least one letter and one number.");if(!b.password().equals(b.confirmPassword()))errors.put("confirmPassword","Passwords do not match.");
    String address=auth.normalizeEmail(b.email());Integer verified=db.query("SELECT 1 FROM email_verifications WHERE email=? AND token_hash=? AND verified_at IS NOT NULL AND expires_at>CURRENT_TIMESTAMP",rs->rs.next()?1:null,address,auth.sha256(b.emailVerificationToken()));if(verified==null)errors.put("email","Verify your email before creating the account.");
    if(!errors.isEmpty())throw new ApiException(HttpStatus.BAD_REQUEST,"Check the form fields.",errors);if(auth.emailExists(address))throw new ApiException(HttpStatus.CONFLICT,"An account already exists with this email.",Map.of("email","Email already registered."));
    long id=auth.createUser(b.fullName().trim(),address,b.password());db.update("INSERT INTO reader_profiles(user_id) VALUES(?)",id);db.update("DELETE FROM email_verifications WHERE email=?",address);var user=new AuthService.User(id,b.fullName().trim(),address,0);var session=auth.createSession(id);
    return ResponseEntity.status(201).header(HttpHeaders.SET_COOKIE,cookie(session.token(),session.maxAge()).toString()).body(Map.of("user",user));
  }
  @PostMapping("/login") public ResponseEntity<Map<String,Object>> login(@Valid @RequestBody LoginBody b){
    var rows=db.query("SELECT u.id,u.full_name,u.email,u.password_hash,u.password_salt,COALESCE(p.onboarding_completed,0) FROM users u LEFT JOIN reader_profiles p ON p.user_id=u.id WHERE u.email=?",(rs,n)->new Object[]{rs.getLong(1),rs.getString(2),rs.getString(3),rs.getString(4),rs.getString(5),rs.getInt(6)},auth.normalizeEmail(b.email()));
    if(rows.isEmpty()||!auth.passwordMatches(b.password(),(String)rows.getFirst()[3],(String)rows.getFirst()[4]))throw new ApiException(HttpStatus.UNAUTHORIZED,"Incorrect email or password.");var r=rows.getFirst();var user=new AuthService.User((long)r[0],(String)r[1],(String)r[2],(int)r[5]);var session=auth.createSession(user.id());return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,cookie(session.token(),session.maxAge()).toString()).body(Map.of("user",user));
  }
  @PostMapping("/logout") public ResponseEntity<Map<String,String>> logout(HttpServletRequest req){auth.deleteSession((String)req.getAttribute("narratiaaToken"));return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,cookie("",0).toString()).body(Map.of("message","Signed out."));}
}
