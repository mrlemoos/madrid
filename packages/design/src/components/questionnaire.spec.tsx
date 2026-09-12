import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Questionnaire,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnaireProgress,
  QuestionnaireTitle,
} from './questionnaire.js';

describe('Questionnaire', () => {
  it('advances after the reader chooses a required answer', () => {
    // Arrange
    render(
      <Questionnaire
        items={[
          { name: 'language', required: true, choices: [{ value: 'en-GB' }] },
          { name: 'streak', required: true, choices: [{ value: 'yes' }] },
        ]}
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="language" required>
          <QuestionnaireTitle>Language</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="en-GB">English</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireNext>Continue</QuestionnaireNext>
        </QuestionnaireItem>
        <QuestionnaireItem name="streak" required>
          <QuestionnaireTitle>Streak</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="yes">Yes</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
      </Questionnaire>,
    );

    // Act
    fireEvent.click(screen.getByRole('radio', { name: 'English' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Assert
    expect(screen.getByRole('group', { name: 'Streak' })).toBeTruthy();
  });
});
