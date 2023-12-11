// PRODUCTS
type ProductProps = {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  imageUrl?: string;
  type?: string;
  discountCost?: number;
  description?: string;
  specs?: ProductSpecsProps;
};

type ProductSpecsProps = {
  brand?: string;
  item?: string;
  model?: string;
  version?: string;
  size?: string;
  specs?: string;
};

// USERS
type UserProps = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  isAdmin?: boolean;
  createAt?: string;
};

type UserCreateProps = UserProps & {
  password: string;
  passwordHash: undefined;
};

// SESSION
type SessionProps = {
  _id?: string;
  userId: string;
  sessionId: string;
  source: "WHATSAPP";
  createdAt: Date;
  modifiedAt: Date;
}

type SessionMainProps = Omit<SessionProps, "createdAt" | "modifiedAt">

//API
type ApiResponse = {
  msg?: string;
  success?: boolean;
  data?: any;
};

type FulfilmentMessages = {
  text: {
    text: string[];
  };
};

type OutputContext = {
  name?: string;
  parameters: any;
  lifespanCount: number;
};

type SessionEntity = {
  name: string;
  entities: { value: string; synonyms: string[] }[];
  entityOverrideMode: string;
};

type IntentRequest = {
  responseId: string;
  queryResult: {
    queryText?: string;
    parameters: any;
    allRequiredParamsPresent: boolean;
    fulfillmentText: string;
    fulfillmentMessages: FulfilmentMessages[];
    outputContexts: OutputContext[];
    intent: {
      name: string;
      displayName: string;
    };
    intentDetectionConfidence: number;
    languageCode: string;
  };
  originalDetectIntentRequest: {
    source: string;
    payload: any;
  };
  session: string;
};

type TextResponseTemplate = {
  text?: {
    text: string[];
  };
};

type CardResponseTemplate = {
  card?: {
    title: string;
    subtitle: string;
    imageUri: string;
    buttons: { text: string; postback: string }[];
  };
};

type WebhookResponses = {
  fulfillmentMessages?: Partial<TextResponseTemplate & CardResponseTemplate>[];
  outputContexts?: OutputContext[];
  sessionEntityTypes?: Partial<SessionEntity>[];
};


