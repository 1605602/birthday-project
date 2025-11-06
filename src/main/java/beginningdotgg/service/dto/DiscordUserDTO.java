package beginningdotgg.service.dto;

import beginningdotgg.model.DiscordUser;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiscordUserDTO {
    private Long id;
    private String loginName;

    private DiscordUserDTO toDTO(DiscordUser user) {
        return new DiscordUserDTO(user.getId(), user.getLoginName());
    }

}
