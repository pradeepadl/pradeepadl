package com.cddp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling backs AiJobTimeoutSweeper (com.cddp.ai.scheduler) —
// sweeps AI agent jobs that never got a response from the Python side.
@EnableScheduling
@SpringBootApplication
public class ComplianceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ComplianceApplication.class, args);
    }

}
