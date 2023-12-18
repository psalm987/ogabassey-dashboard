import axios from "axios";

const APIversion = "v17.0";

const pageID = process.env.OGABASSEY_PAGE_ID;

const pageAccessToken = process.env.MESSENGER_ACCESS_TOKEN;

const messengerAxios = axios.create({
  baseURL: `https://graph.facebook.com/${APIversion}/`,
  headers: {
    Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

export const sendTextMessage = async (message: string, recipientID: string) => {
  return await messengerAxios.post(
    `${pageID}/messages?access_token=${pageAccessToken}`,
    {
      recipient: {
        id: recipientID,
      },
      messaging_type: "RESPONSE",
      message: {
        text: message,
      },
    }
  );
};
