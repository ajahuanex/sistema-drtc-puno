// Simple TypeScript verification for lista-documentos components
// This file is just for verification and can be deleted

import { ListaDocumentosComponent } from './src/app/components/mesa-partes/lista-documentos.component';
import { DocumentosFiltrosComponent } from './src/app/components/mesa-partes/documentos-filters.component';

// If this compiles, the components are correctly typed
const listaComponent: typeof ListaDocumentosComponent = ListaDocumentosComponent;
const filtrosComponent: typeof DocumentosFiltrosComponent = DocumentosFiltrosComponent;

console.log('✅ Components verified successfully');
