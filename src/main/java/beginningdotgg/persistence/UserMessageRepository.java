package beginningdotgg.persistence;

import beginningdotgg.model.DiscordUser;
import beginningdotgg.model.UserMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface UserMessageRepository extends JpaRepository<UserMessage, Long> {

    List<UserMessage> findAllByUserId(Long id);

    List<UserMessage> findByUser(DiscordUser user);
}
