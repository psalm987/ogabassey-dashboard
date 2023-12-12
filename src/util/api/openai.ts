import OpenAI from "openai";

let openai: OpenAI;

(() => {
  openai = new OpenAI();
})();

export const complete = async (message: string, instruction?: string) => {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: instruction || "You are a helpful assistant.",
      },
      { role: "user", content: message },
    ],
    model: "gpt-3.5-turbo",
  });

  console.log("COMPLETION: ", completion.choices[0].message);

  return completion.choices[0].message.content;
};
