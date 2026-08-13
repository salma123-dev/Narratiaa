package com.narratiaa.auth;

import com.narratiaa.common.ApiException;
import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import java.util.HexFormat;

@Service
public class AuthService {
  public static final String COOKIE="narratiaa_session";
  private final JdbcTemplate db; private final SecureRandom random=new SecureRandom();
  public AuthService(JdbcTemplate db){this.db=db;}
  public record User(long id,String fullName,String email,int onboardingCompleted){}
  public record Session(String token,long maxAge){}

  public String normalizeEmail(String email){return Objects.toString(email,"").trim().toLowerCase(Locale.ROOT);}
  public String sha256(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
  private String token(int bytes){byte[] b=new byte[bytes];random.nextBytes(b);return Base64.getUrlEncoder().withoutPadding().encodeToString(b);}
  public String verificationCode(){return String.valueOf(100000+random.nextInt(900000));}
  public String passwordSalt(){byte[] b=new byte[16];random.nextBytes(b);return HexFormat.of().formatHex(b);}
  public String passwordHash(String password,String salt){return HexFormat.of().formatHex(SCrypt.generate(password.getBytes(StandardCharsets.UTF_8),salt.getBytes(StandardCharsets.UTF_8),16384,8,1,64));}
  public boolean passwordMatches(String password,String hash,String salt){return MessageDigest.isEqual(HexFormat.of().parseHex(passwordHash(password,salt)),HexFormat.of().parseHex(hash));}
  public boolean emailExists(String email){return Boolean.TRUE.equals(db.query("SELECT 1 FROM users WHERE email=?",(org.springframework.jdbc.core.ResultSetExtractor<Boolean>)rs->rs.next(),normalizeEmail(email)));}
  public User currentUser(String token){
    if(token==null||token.isBlank())return null;
    var users=db.query("SELECT u.id,u.full_name,u.email,COALESCE(p.onboarding_completed,0) FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN reader_profiles p ON p.user_id=u.id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP",(rs,n)->new User(rs.getLong(1),rs.getString(2),rs.getString(3),rs.getInt(4)),sha256(token));
    return users.isEmpty()?null:users.getFirst();
  }
  public Session createSession(long userId){String t=token(32);long seconds=604800;db.update("INSERT INTO sessions(user_id,token_hash,expires_at) VALUES(?,?,?)",userId,sha256(t),OffsetDateTime.now(ZoneOffset.UTC).plusSeconds(seconds));return new Session(t,seconds);}
  public void deleteSession(String token){if(token!=null)db.update("DELETE FROM sessions WHERE token_hash=?",sha256(token));}
  public long createUser(String fullName,String email,String password){String salt=passwordSalt();return db.queryForObject("INSERT INTO users(full_name,email,password_hash,password_salt) VALUES(?,?,?,?) RETURNING id",Long.class,fullName,normalizeEmail(email),passwordHash(password,salt),salt);}
  public User requireUser(jakarta.servlet.http.HttpServletRequest request){var u=(User)request.getAttribute("narratiaaUser");if(u==null)throw new ApiException(HttpStatus.UNAUTHORIZED,"Not authenticated.");return u;}
}
