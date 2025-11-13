Feature: Level Progression System
  As a player
  I want to progress through different levels
  So that I can advance in the jailbreak game

  Background:
    Given I am authenticated as a player
    And I am on the game page

  Scenario: Player starts at level 1
    Given I am a new player
    When I check my current level
    Then I should be at level 1
    And I should see level 1 content

  Scenario: Player completes level 1 successfully
    Given I am at level 1
    And the level requires password "testpassword"
    When I enter the correct password "testpassword"
    Then I should advance to level 2
    And I should see a level completion message
    And my progress should be saved

  Scenario: Player enters incorrect password
    Given I am at level 1
    And the level requires password "testpassword"
    When I enter an incorrect password "wrongpass"
    Then I should remain at level 1
    And I should see an error message "Incorrect password"
    And I should be able to try again

  Scenario: Player views level information
    Given I am at level 3
    When I view the level details
    Then I should see the level name
    And I should see the difficulty rating
    And I should see level-specific hints

  Scenario: Player progresses through multiple levels
    Given I am at level 1
    When I complete level 1 with password "testpassword"
    And I complete level 2 with password "2f8adf80dcbf15fa"
    And I complete level 3 with password "8ef5a3c5330adfe9"
    Then I should be at level 4
    And my completion history should show 3 completed levels