export class EmailMessage {
  constructor(
    public readonly to: string,
    public readonly subject: string,
    public readonly htmlBody: string,
    public readonly textBody: string,
  ) {}
}
