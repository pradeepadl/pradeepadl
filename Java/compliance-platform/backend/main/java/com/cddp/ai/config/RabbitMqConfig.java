package com.cddp.ai.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.json.JsonMapper;

/**
 * Wires the Java <-> Python AI agent transport described in
 * files/ai-agent-integration-plan.md. Both queues sit on the default
 * (nameless) exchange — RabbitMQ auto-binds every queue to it under its
 * own name, so publishing with routing_key = queue name reaches it
 * without an explicit exchange/binding on either side.
 *
 * <p>The message converter here uses its own snake_case {@link JsonMapper}
 * (Jackson 3 — this app's default Jackson, see spring-boot-starter-jackson),
 * deliberately separate from the app's default REST Jackson config: the AI
 * agent wire format is shared with the Python SDK's Pydantic models (see
 * cddp_ai_sdk.core.models), which use snake_case, regardless of how the
 * rest of the API serializes JSON.
 */
@Configuration
public class RabbitMqConfig {

    public static final String REQUEST_QUEUE = "ai.agent.requests";
    public static final String RESPONSE_QUEUE = "ai.agent.responses";

    @Bean
    public MessageConverter aiAgentMessageConverter() {
        // Jackson 3 writes java.time types as ISO-8601 strings by default
        // (the old WRITE_DATES_AS_TIMESTAMPS toggle is gone) — no extra
        // config needed to match Python's Pydantic datetime parsing.
        JsonMapper mapper = JsonMapper.builder()
                .findAndAddModules(JacksonJsonMessageConverter.class.getClassLoader())
                .propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .build();
        return new JacksonJsonMessageConverter(mapper, "com.cddp.ai.dto");
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter aiAgentMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(aiAgentMessageConverter);
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory, MessageConverter aiAgentMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(aiAgentMessageConverter);
        return factory;
    }

    @Bean
    public Queue aiAgentRequestsQueue() {
        return QueueBuilder.durable(REQUEST_QUEUE).build();
    }

    @Bean
    public Queue aiAgentResponsesQueue() {
        return QueueBuilder.durable(RESPONSE_QUEUE).build();
    }
}
