package com.eventhub.admin;

import com.eventhub.auth.Role;
import com.eventhub.auth.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Promotes a configured email to ADMIN on startup. Register the account normally,
 * then set APP_ADMIN_EMAIL to grant it admin rights — no manual SQL needed.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository users;
    private final String adminEmail;

    public AdminBootstrap(UserRepository users,
                          @Value("${app.admin.bootstrap-email:}") String adminEmail) {
        this.users = users;
        this.adminEmail = adminEmail;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminEmail.isBlank()) {
            return;
        }
        users.findByEmail(adminEmail.trim().toLowerCase()).ifPresent(user -> {
            if (user.getRole() != Role.ADMIN) {
                user.setRole(Role.ADMIN);
                log.info("Promoted {} to ADMIN", user.getEmail());
            }
        });
    }
}
