package com.narratiaa.auth;

import tools.jackson.databind.ObjectMapper;
import com.narratiaa.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.*;
import java.util.Map;

@Service
public class EmailService {
  private final String apiKey,from; private final ObjectMapper json;
  public EmailService(@Value("${narratiaa.resend-api-key:}")String apiKey,@Value("${narratiaa.email-from}")String from,ObjectMapper json){this.apiKey=apiKey;this.from=from;this.json=json;}
  public boolean send(String email,String code){
    if(apiKey.isBlank()){System.out.printf("[Narratiaa] Verification code for %s: %s%n",email,code);return true;}
    try{
      String html="<div style='font-family:Georgia,serif;background:#0b0e16;color:#fff7eb;padding:32px'><h1 style='color:#ffd895'>NARRATIAA</h1><p>Your verification code is:</p><p style='font-size:32px;letter-spacing:8px'><strong>"+code+"</strong></p><p>It expires in 10 minutes.</p></div>";
      var body=json.writeValueAsString(Map.of("from",from,"to",new String[]{email},"subject","Verify your Narratiaa email","html",html));
      var req=HttpRequest.newBuilder(URI.create("https://api.resend.com/emails")).header("Authorization","Bearer "+apiKey).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
      var res=HttpClient.newHttpClient().send(req,HttpResponse.BodyHandlers.ofString());
      if(res.statusCode()<200||res.statusCode()>=300)throw new IllegalStateException(res.body()); return false;
    }catch(Exception e){throw new ApiException(HttpStatus.BAD_GATEWAY,"We could not send a verification email. Please check the address and try again.");}
  }
}
