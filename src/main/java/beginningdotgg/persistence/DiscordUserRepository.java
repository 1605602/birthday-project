package beginningdotgg.persistence;

import beginningdotgg.model.DiscordUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DiscordUserRepository extends JpaRepository<DiscordUser, Long> {
    Optional<DiscordUser> findByLoginName(String loginName);
}
