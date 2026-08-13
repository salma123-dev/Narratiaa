package com.narratiaa.auth;

import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import java.util.*;

@Component
public class AuthenticationInterceptor implements HandlerInterceptor {
  private final AuthService auth;
  public AuthenticationInterceptor(AuthService auth){this.auth=auth;}
  @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler){
    String token=Arrays.stream(Optional.ofNullable(request.getCookies()).orElse(new Cookie[0])).filter(c->AuthService.COOKIE.equals(c.getName())).map(Cookie::getValue).findFirst().orElse(null);
    var user=auth.currentUser(token); if(user!=null)request.setAttribute("narratiaaUser",user); request.setAttribute("narratiaaToken",token); return true;
  }
}
