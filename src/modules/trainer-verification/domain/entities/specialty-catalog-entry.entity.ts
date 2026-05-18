export interface SpecialtyCatalogEntryProps {
  key: string;
  displayName: string;
  category: string;
  iconUrl: string | null;
  createdAt: Date;
}

export class SpecialtyCatalogEntry {
  public readonly key: string;
  public readonly displayName: string;
  public readonly category: string;
  public readonly iconUrl: string | null;
  public readonly createdAt: Date;

  private constructor(props: SpecialtyCatalogEntryProps) {
    this.key = props.key;
    this.displayName = props.displayName;
    this.category = props.category;
    this.iconUrl = props.iconUrl;
    this.createdAt = props.createdAt;
  }

  static reconstitute(
    props: SpecialtyCatalogEntryProps,
  ): SpecialtyCatalogEntry {
    return new SpecialtyCatalogEntry(props);
  }
}
