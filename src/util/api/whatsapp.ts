import axios from "axios";

const APIversion = "v17.0";

const whatsappSenderPhoneNumber = process.env.PHONE_NUMBER_ID!;

const whatsappAxios = axios.create({
  baseURL: `https://graph.facebook.com/${APIversion}/`,
  headers: {
    Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

export const registerToCloudAPI = async (pin: string) => {
  const pattern = /\d{6}/;
  const match = pin.match(pattern);
  if (!(match && pin === match[0])) {
    throw Error("Pin should be of 6 digits");
  }
  return await whatsappAxios.post(`${whatsappSenderPhoneNumber}/messages`, {
    messaging_product: "whatsapp",
    pin,
  });
};

export const sendTextMessage = async (
  message: string,
  to: string,
  context?: {
    message_id: string;
  }
) => {
  return await whatsappAxios.post(`${whatsappSenderPhoneNumber}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    context,
    text: {
      preview_url: true,
      body: message,
    },
  });
};

export const sendCustomMessage = async (message: any, to: string) => {
  console.log("MESSAGE RESPONSE...", message);
  return await whatsappAxios.post(`${whatsappSenderPhoneNumber}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    ...message,
  });
};

export const markMessageRead = async (message_id: string) => {
  try {
    return await whatsappAxios.post(`${whatsappSenderPhoneNumber}/messages`, {
      messaging_product: "whatsapp",
      status: "read",
      message_id,
    });
  } catch (error: any) {
    // if (error.response) {
    //   console.error(error.response.data);
    //   console.error(error.response.status);
    //   // console.error(error.response.headers);
    // } else if (error.request) {
    //   console.error(error.request);
    // } else {
    //   console.error("Error", error.message);
    // }
  }
};
