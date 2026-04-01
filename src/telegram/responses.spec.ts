import {
  getRandomResponse,
  getAllResponses,
  ResponseCategory,
} from './responses';

describe('Telegram Responses', () => {
  const categories: ResponseCategory[] = [
    'welcome',
    'transaction_created',
    'high_spending',
    'report',
    'encouragement',
    'unknown',
  ];

  describe('getAllResponses', () => {
    it.each(categories)(
      'should have at least 3 variations for "%s"',
      (category) => {
        const responses = getAllResponses(category);
        expect(responses.length).toBeGreaterThanOrEqual(3);
      },
    );

    it('should return a copy of the array (not the original reference)', () => {
      const first = getAllResponses('welcome');
      const second = getAllResponses('welcome');
      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });
  });

  describe('getRandomResponse', () => {
    it.each(categories)(
      'should return a string from the "%s" category',
      (category) => {
        const response = getRandomResponse(category);
        const allInCategory = getAllResponses(category);
        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
        expect(allInCategory).toContain(response);
      },
    );

    it('should return varied responses over multiple calls', () => {
      const results = new Set<string>();

      // Run enough times to make it very unlikely we get the same every time
      for (let i = 0; i < 50; i++) {
        results.add(getRandomResponse('welcome'));
      }

      // With 5 options and 50 tries, we should see at least 2 different responses
      expect(results.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('tone of voice alignment', () => {
    it('should include emojis in all categories', () => {
      const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;

      for (const category of categories) {
        const responses = getAllResponses(category);
        const hasEmoji = responses.every((r) => emojiRegex.test(r));
        expect(hasEmoji).toBe(true);
      }
    });

    it('should not contain aggressive or judgmental language', () => {
      const negativePhrases = [
        'burro',
        'idiota',
        'ridículo',
        'incompetente',
        'vergonha',
        'fracasso',
      ];

      for (const category of categories) {
        const responses = getAllResponses(category);
        for (const response of responses) {
          const lower = response.toLowerCase();
          for (const phrase of negativePhrases) {
            expect(lower).not.toContain(phrase);
          }
        }
      }
    });
  });
});
