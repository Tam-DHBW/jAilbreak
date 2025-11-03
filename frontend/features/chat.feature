Feature: Gatekeeper Chat
  Background:
    Given I am on the game page

  Scenario: I should be able to chat
    Then The chat box exists

  Scenario: I want a response
    When I send a message to the gatekeeper
    Then There is a response from the gatekeeper

