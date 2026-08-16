package com.narratiaa.auth;

import com.narratiaa.common.ApiException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
  private final JavaMailSender mail; private final String username,from;
  public EmailService(JavaMailSender mail,@Value("${spring.mail.username:}")String username,@Value("${narratiaa.email-from:}")String from){this.mail=mail;this.username=username;this.from=from;}
  public boolean send(String email,String code){
    return sendCode(email,code,"Verify your Narratiaa email","Your verification code is:");
  }
  public boolean sendPasswordReset(String email,String code){
    return sendCode(email,code,"Reset your Narratiaa password","Your password reset code is:");
  }
  private boolean sendCode(String email,String code,String subject,String introduction){
    if(username.isBlank()){System.out.printf("[Narratiaa] %s for %s: %s%n",subject,email,code);return true;}
    try{
      String html="<div style='font-family:Georgia,serif;background:#0b0e16;color:#fff7eb;padding:32px'><h1 style='color:#ffd895'>NARRATIAA</h1><p>"+introduction+"</p><p style='font-size:32px;letter-spacing:8px'><strong>"+code+"</strong></p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p></div>";
      MimeMessage message=mail.createMimeMessage();var helper=new MimeMessageHelper(message,"UTF-8");helper.setFrom(from.isBlank()?username:from);helper.setTo(email);helper.setSubject(subject);helper.setText(html,true);mail.send(message);return false;
    }catch(Exception e){System.err.printf("[Narratiaa] SMTP delivery failed for %s: %s%n",email,e.getMessage());throw new ApiException(HttpStatus.BAD_GATEWAY,"We could not send a verification email. Please check the address and try again.");}
  }
}
