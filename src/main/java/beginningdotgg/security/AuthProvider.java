package beginningdotgg.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component // ✅ Must be present
@RequiredArgsConstructor
public class AuthProvider implements AuthenticationProvider {

    private final PasswordEncoder passwordEncoder;

    @Value("${application.security.shared-password}")
    private String sharedPassword;

    @Override
    public Authentication authenticate(Authentication authentication) {
        String loginName = authentication.getName();
        String password = authentication.getCredentials().toString();

        if (!passwordEncoder.matches(password, passwordEncoder.encode(sharedPassword))) {
            throw new BadCredentialsException("Invalid password");
        }

        return new UsernamePasswordAuthenticationToken(
                loginName,
                null,
                Collections.emptyList()
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
