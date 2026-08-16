package com.narratiaa.auth;

import com.narratiaa.common.ApiException;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.Map;

@Service
public class EmailService {
  private final String apiKey,from,fromName; private final ObjectMapper json; private final HttpClient http;
  public EmailService(@Value("${narratiaa.brevo-api-key:}")String apiKey,@Value("${narratiaa.email-from}")String from,@Value("${narratiaa.email-from-name:Narratiaa}")String fromName,ObjectMapper json){this.apiKey=apiKey;this.from=from;this.fromName=fromName;this.json=json;this.http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();}
  public boolean send(String email,String code){
    return sendCode(email,code,"Verify your Narratiaa email","Your verification code is:");
  }
  public boolean sendPasswordReset(String email,String code){
    return sendCode(email,code,"Reset your Narratiaa password","Your password reset code is:");
  }
  private boolean sendCode(String email,String code,String subject,String introduction){
    if(apiKey.isBlank()){System.out.printf("[Narratiaa] %s for %s: %s%n",subject,email,code);return true;}
    try{
      String html="<div style='font-family:Georgia,serif;background:#0b0e16;color:#fff7eb;padding:32px'><h1 style='color:#ffd895'>NARRATIAA</h1><p>"+introduction+"</p><p style='font-size:32px;letter-spacing:8px'><strong>"+code+"</strong></p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p></div>";
      var body=json.writeValueAsString(Map.of("sender",Map.of("name",fromName,"email",from),"to",new Object[]{Map.of("email",email)},"subject",subject,"htmlContent",html));
      var request=HttpRequest.newBuilder(URI.create("https://api.brevo.com/v3/smtp/email")).timeout(Duration.ofSeconds(15)).header("api-key",apiKey).header("accept","application/json").header("content-type","application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
      var response=http.send(request,HttpResponse.BodyHandlers.ofString());
      if(response.statusCode()<200||response.statusCode()>=300){System.err.printf("[Narratiaa] Brevo delivery failed (%d): %s%n",response.statusCode(),response.body());throw new IllegalStateException("Brevo rejected the email");}return false;
    }catch(Exception e){System.err.printf("[Narratiaa] Brevo delivery error for %s: %s%n",email,e.getMessage());throw new ApiException(HttpStatus.BAD_GATEWAY,"We could not send a verification email. Please check the address and try again.");}
  }
}
