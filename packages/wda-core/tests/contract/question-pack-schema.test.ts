/**
 * Contract Test - Question Pack YAML Validation
 *
 * @see ../../../../specs/001-phase-5-multi/tasks.md (T031)
 * @task T031
 */

import { describe, it, expect } from 'vitest';
import { QuestionPackValidator } from '@/question-packs/QuestionPackValidator';
import { TEST_WORKSPACE } from '../setup';
import * as yaml from 'js-yaml';

describe('Question Pack YAML Validation', () => {
  let validator: QuestionPackValidator;

  beforeEach(() => {
    validator = new QuestionPackValidator();
  });

  it('should validate valid question pack YAML', async () => {
    const validYaml = `
id: dev-workflow-basics
version: 1.0.0
name:
  de: Entwicklungs-Workflow Grundlagen
  en: Development Workflow Basics
description:
  de: Grundlegende Fragen zum Entwicklungsprozess
  en: Basic questions about development process
category: workflow
tags: [basics, process]
questions:
  - id: q1
    text:
      de: Wie läuft euer Code Review ab?
      en: How does your code review process work?
    type: text
    required: true
    applicableModes: [quick, standard, deep]
`;

    const result = await validator.validateYAML(validYaml);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should validate bilingual text fields', async () => {
    const invalidYaml = `
id: test-pack
version: 1.0.0
name:
  de: Test Pack
questions:
  - id: q1
    text:
      de: Test Frage
    type: text
`;

    const result = await validator.validateYAML(invalidYaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('Missing English text')
    );
  });

  it('should validate question type matches options presence', async () => {
    const invalidYaml = `
id: test-pack
version: 1.0.0
name: {de: Test, en: Test}
questions:
  - id: q1
    text: {de: Frage, en: Question}
    type: single_choice
    required: true
`;

    const result = await validator.validateYAML(invalidYaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('single_choice requires options')
    );
  });

  it('should validate follow-up rules schema', async () => {
    const validYaml = `
id: test-pack
version: 1.0.0
name: {de: Test, en: Test}
questions:
  - id: q1
    text: {de: Frage, en: Question}
    type: text
    followUpRules:
      - condition: answer_too_short
        threshold: 20
        followUpQuestion:
          text: {de: "Kannst du das näher erläutern?", en: "Can you elaborate?"}
`;

    const result = await validator.validateYAML(validYaml);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid pack ID (non-kebab-case)', async () => {
    const invalidYaml = `
id: InvalidPackID
version: 1.0.0
name: {de: Test, en: Test}
questions: []
`;

    const result = await validator.validateYAML(invalidYaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('Pack ID must be kebab-case')
    );
  });

  it('should validate semantic versioning', async () => {
    const invalidYaml = `
id: test-pack
version: 1.0
name: {de: Test, en: Test}
questions: []
`;

    const result = await validator.validateYAML(invalidYaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('Invalid semantic version')
    );
  });

  it('should validate question types', async () => {
    const validTypes = ['text', 'number', 'single_choice', 'multiple_choice', 'scale'];

    for (const type of validTypes) {
      const yamlContent = `
id: test-pack
version: 1.0.0
name: {de: Test, en: Test}
questions:
  - id: q1
    text: {de: Frage, en: Question}
    type: ${type}
    required: true
    ${type.includes('choice') ? 'options: {de: [A, B], en: [A, B]}' : ''}
    ${type === 'scale' ? 'scale: {min: 1, max: 5}' : ''}
`;

      const result = await validator.validateYAML(yamlContent);
      expect(result.valid).toBe(true);
    }
  });

  it('should validate scale range', async () => {
    const invalidYaml = `
id: test-pack
version: 1.0.0
name: {de: Test, en: Test}
questions:
  - id: q1
    text: {de: Frage, en: Question}
    type: scale
    scale: {min: 5, max: 1}
`;

    const result = await validator.validateYAML(invalidYaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('Scale min must be less than max')
    );
  });

  it('should validate applicable modes', async () => {
    const invalidYaml = `
id: test-pack
version: 1.0.0
name: {de: Test, en: Test}
questions:
  - id: q1
    text: {de: Frage, en: Question}
    type: text
    applicableModes: [invalid_mode]
`;

    const result = await validator.validateYAML(invalidYaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('Invalid mode')
    );
  });

  it('should validate required fields', async () => {
    const minimalYaml = `
id: test-pack
version: 1.0.0
questions: []
`;

    const result = await validator.validateYAML(minimalYaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('name is required'));
  });
});
