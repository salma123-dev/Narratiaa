package com.narratiaa;

import com.narratiaa.auth.AuthService;import org.junit.jupiter.api.Test;import org.springframework.boot.test.context.SpringBootTest;import org.springframework.jdbc.core.JdbcTemplate;import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.mock;

@SpringBootTest(properties="spring.sql.init.mode=never")
class NarratiaaApplicationTests {
  @Test void contextLoads(){}
  @Test void remainsCompatibleWithNodeScryptPasswords(){var auth=new AuthService(mock(JdbcTemplate.class));var expected="d31ee8ec5e376fa74391bf2ae9523d438273f029fd654a838ef6aca807cc1b338fad5218ad96dc25a39c667f92e83c367e48578f30e90be04bf7acc3a514eee8";assertEquals(expected,auth.passwordHash("Reader123","00112233445566778899aabbccddeeff"));assertTrue(auth.passwordMatches("Reader123",expected,"00112233445566778899aabbccddeeff"));}
}
