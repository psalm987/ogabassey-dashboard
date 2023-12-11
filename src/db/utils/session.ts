import Session from "@db/models/session";

export const addSession = async (
    session: SessionMainProps
) => {
    const newSession = new Session(session);
    const result = await newSession.save();
    return result
}


export const updateSession = async (session: Partial<SessionMainProps>) => {
    const filterProps = []
    if (session.userId) filterProps.push({ userId: session.userId })
    if (session.sessionId) filterProps.push({ sessionId: session.sessionId })
    const updatedSession = await Session.findOneAndUpdate({ $or: filterProps }, session)
    return updatedSession
}

export const findSession = async (session: Partial<SessionMainProps>) => {
    const filterProps = []
    if (session.userId) filterProps.push({ userId: session.userId })
    if (session.sessionId) filterProps.push({ sessionId: session.sessionId })
    const searchedSession = await Session.findOne({
        $or: filterProps
    })
    return searchedSession
}