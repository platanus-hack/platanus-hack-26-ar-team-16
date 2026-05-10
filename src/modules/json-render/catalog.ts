import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react-native/schema';
import {
  standardComponentDefinitions,
  standardActionDefinitions,
} from '@json-render/react-native/catalog';
import { z } from 'zod';

export const catalog = defineCatalog(schema, {
  components: standardComponentDefinitions,
  actions: {
    ...standardActionDefinitions,
    reply: {
      params: z.object({ text: z.string() }),
      description:
        'Send the text value as a user reply in the chat. Use for quick-reply buttons so the user can tap instead of typing.',
    },
  },
});

export const inlinePrompt = catalog.prompt({ mode: 'inline' });
