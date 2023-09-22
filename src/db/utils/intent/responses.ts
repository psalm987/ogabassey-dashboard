export const generateTextResponses = (responses: string | string[]) => {
  return {
    fulfillmentMessages: [
      {
        text: {
          text: typeof responses === "string" ? [responses] : responses,
        },
      },
    ],
  };
};

export const generateChipResponses = (responses: string[]) => {
  return {
    fulfillmentMessages: [
      {
        quickReplies: { quickReplies: responses },
      },
      {
        payload: {
          quick_replies: responses,
          richContent: [
            [
              {
                type: "chips",
                options: responses?.map?.((response) => ({ text: response })),
              },
            ],
          ],
        },
      },
    ],
  };
};

export const generateCardResponses = (
  cards: {
    title?: string;
    subtitle?: string;
    imageUri?: string;
    buttons?: { text: string; postback: string }[];
  }[]
) => {
  return {
    fulfillmentMessages: [
      ...cards.map((card) => ({
        card,
      })),
      {
        payload: {
          richContent: [
            ...cards.map((card) => ({
              type: "card",
              options: card,
            })),
          ],
        },
      },
    ],
  };
};

export const combineResponses = (...responses: any[]) => {
  const result = Object.assign({}, ...responses);
  result.fulfillmentMessages = responses?.reduce((prev, curr) => {
    if (curr.fulfillmentMessages) return [...prev, ...curr.fulfillmentMessages];
    return prev;
  }, []);
  return result;
};
