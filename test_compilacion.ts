// Test simple de compilación TypeScript
export interface TestInterface {
  id: string;
  name: string;
}

export class TestClass {
  private data: TestInterface[] = [];
  
  constructor() {
    console.log('Test class initialized');
  }
  
  addItem(item: TestInterface): void {
    this.data.push(item);
  }
  
  getItems(): TestInterface[] {
    return this.data;
  }
}

// Test de sintaxis básica
const testInstance = new TestClass();
testInstance.addItem({ id: '1', name: 'Test' });
console.log(testInstance.getItems());