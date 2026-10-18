/** Reads the raw text of one stream event into a typed value; undefined drops a malformed event. */
export type EventDecoder<Event> = (data: string) => Event | undefined;

/** One decoder per event name a feature wants from the shared stream. */
export type EventDecoders<Event> = Readonly<
  Record<string, EventDecoder<Event>>
>;
