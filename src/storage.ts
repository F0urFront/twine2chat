import { Storage, StoreItems } from 'botbuilder-core';
import DynamoDB from 'aws-sdk/clients/dynamodb';


export default class implements Storage {
  client: DynamoDB.DocumentClient;
  tableName: string;
  constructor(region: string, tableName: string) {
    this.client = new DynamoDB.DocumentClient({ region });
    this.tableName = tableName;
  }

  save(data: string, name: string) {

  }

  load(name: string) {
    return 'TODO';
  }

  async read(keys: string[]): Promise<StoreItems> {
    const res = await this.client.batchGet({ RequestItems: { [this.tableName]: {
      Keys: keys.map(k => ({ 'id': k })),
    }}}).promise();

    const items: any = {};
    if (res.Responses) {
      console.log(res.Responses);
      res.Responses[this.tableName].forEach(r => {
        items[r.id] = JSON.parse(r.conversation);
      });
    }
    return items;
  }

  async write(changes: StoreItems) {
    await this.client.batchWrite({ RequestItems: { [this.tableName]: Object.keys(changes).map(k => ({
      PutRequest: { Item: {
        id: k,
        conversation: JSON.stringify(changes[k]),
      } },
    })) } }).promise();
  }

  async delete(keys: string[]) {
    await this.client.batchWrite({ RequestItems: { [this.tableName]: keys.map(k => ({
      DeleteRequest: { Key: { id: k } },
    })) } }).promise();
  }

  async deleteAll() {
    const res = await this.client.scan({ TableName: this.tableName }).promise();
    const items = res.Items;
    if (!items || items.length <= 0) return;

    await this.client.batchWrite({ RequestItems: { [this.tableName]: items.map(i => ({
      DeleteRequest: { Key: { id: i.id } },
    })) } }).promise();
  }
}
