Feature: Homepage Title
  As a energy system user
  I want to have a proper title displayed on energy system homepage

  Scenario: Visiting homepage
    Given I load / page
    Then I should see "Tienda energy system" as the page title
