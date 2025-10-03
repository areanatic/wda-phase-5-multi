/**
 * FreierTalkDetector - Detects when to suggest Freier Talk mode
 */

export interface DetectionResult {
  detected: boolean;
  confidence?: number;
  freierTalkPotential?: 'low' | 'medium' | 'high';
}

export interface TransitionMessage {
  message: string;
}

/**
 * FreierTalkDetector - Analyzes answers for freier talk triggers
 */
export class FreierTalkDetector {
  /**
   * Detect frustration in answer
   */
  detectFrustration(answer: string): DetectionResult {
    const frustratedKeywords = [
      'frustrated',
      'frustration',
      'frustriert',
      'hate',
      'hasse',
      'terrible',
      'schrecklich',
      'nothing works',
      'funktioniert nicht',
      'problems',
      'probleme',
    ];

    const answerLower = answer.toLowerCase();
    const matchCount = frustratedKeywords.filter((kw) => answerLower.includes(kw)).length;

    return {
      detected: matchCount > 0,
      confidence: Math.min(matchCount / 3, 1),
    };
  }

  /**
   * Detect digression from topic
   */
  detectDigression(questionTopic: string, answer: string): DetectionResult {
    const digressionPhrases = [
      'that reminds me',
      'das erinnert mich',
      'actually',
      'eigentlich',
      'also',
      'außerdem',
      'another issue',
      'ein anderes problem',
    ];

    const answerLower = answer.toLowerCase();
    const detected = digressionPhrases.some((phrase) => answerLower.includes(phrase));

    return {
      detected,
      confidence: detected ? 0.8 : 0,
    };
  }

  /**
   * Should suggest freier talk?
   */
  shouldSuggestFreierTalk(answer: string): boolean {
    const frustration = this.detectFrustration(answer);
    return frustration.detected && (frustration.confidence || 0) > 0.6;
  }

  /**
   * Detect insight opportunity
   */
  detectInsightOpportunity(answer: string): DetectionResult {
    const insightPhrases = [
      'i\'ve noticed',
      'ich habe bemerkt',
      'pattern',
      'muster',
      'broader',
      'breiter',
      'connects to',
      'hängt zusammen',
    ];

    const answerLower = answer.toLowerCase();
    const matchCount = insightPhrases.filter((phrase) => answerLower.includes(phrase)).length;

    return {
      detected: matchCount > 0,
      freierTalkPotential: matchCount > 1 ? 'high' : matchCount > 0 ? 'medium' : 'low',
    };
  }

  /**
   * Generate transition message to freier talk
   */
  generateTransitionMessage(answer: string): TransitionMessage {
    return {
      message:
        'Das klingt interessant! Möchtest du darüber mehr erzählen? Wir können gerne vom strukturierten Interview abweichen.',
    };
  }
}
