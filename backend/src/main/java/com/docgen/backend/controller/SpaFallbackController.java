package com.docgen.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * SPA Fallback Controller
 *
 * When the React app is served by Spring Boot (production mode), any route the
 * user directly navigates to or refreshes (e.g. /history, /generate/invoice)
 * would return HTTP 404 because Spring Boot has no handler for those paths.
 *
 * This controller intercepts all such requests that are:
 *   - NOT under /api/** (REST endpoints)
 *   - NOT a static resource (served from /static or classpath)
 *   - NOT /error
 *
 * And forwards them to /index.html so that React Router can take over
 * client-side and render the correct page.
 */
@Controller
public class SpaFallbackController {

    /**
     * Catch-all for HTML navigation requests.
     * Uses Spring's forward (not redirect) so the browser URL stays the same.
     */
    @RequestMapping(value = {
            "/",
            "/history",
            "/generate/**",
            // Add any future top-level React routes here
    })
    public String spa() {
        return "forward:/index.html";
    }
}
