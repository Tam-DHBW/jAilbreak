Feature: Level Selection
  Background:
    Given I am on the game page

  Scenario: User selects a level
    When I click on a level
    Then The chat history should be cleared
    And The current level info should be updated
