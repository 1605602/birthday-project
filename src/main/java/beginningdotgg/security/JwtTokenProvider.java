package beginningdotgg.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component // ✅ This is required
public class JwtTokenProvider {

    @Value("${application.security.jwt.secret-key}")
    private String jwtSecret;

    @Value("${application.security.jwt.expiration}")
    private int expirationInMs;

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String generateToken(String loginName) {
        long nowMillis = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(loginName)
                .setIssuedAt(new Date(nowMillis))
                .setExpiration(new Date(nowMillis + expirationInMs))
                .signWith(key())
                .compact();
    }

    public String getLoginNameFromJWT(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public void validateToken(String token) throws JwtException {
        Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token);
    }
}
