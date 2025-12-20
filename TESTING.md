# Guía de Pruebas

Este documento proporciona una guía sobre cómo escribir y ejecutar pruebas en este proyecto.

## Visión General

Este proyecto utiliza [Jest](https://jestjs.io/) como framework de pruebas. Las pruebas están escritas en TypeScript y se encuentran junto a los archivos de código fuente, con la extensión `.spec.ts`.

## Ejecutar Pruebas

Para ejecutar todas las pruebas, utiliza el siguiente comando:

```bash
npm test
```

## Escribir Pruebas

### Pruebas Unitarias de Servicios

Las pruebas unitarias de servicios se centran en probar la lógica de negocio de un servicio de forma aislada. Para ello, es necesario simular (mock) las dependencias del servicio.

A continuación se muestra un ejemplo de una prueba para un servicio simple:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';
import { MyDependency } from './my.dependency';

// Simula la dependencia
const mockMyDependency = {
  doSomething: jest.fn(),
};

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: MyDependency, useValue: mockMyDependency },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('myMethod', () => {
    it('should call the dependency', () => {
      service.myMethod();
      expect(mockMyDependency.doSomething).toHaveBeenCalled();
    });
  });
});
```

### Pruebas de Controladores

Las pruebas de controladores se centran en probar que las rutas de un controlador responden correctamente. Al igual que con los servicios, es necesario simular las dependencias del controlador.

A continuación se muestra un ejemplo de una prueba para un controlador:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyController } from './my.controller';
import { MyService } from './my.service';

const mockMyService = {
  myMethod: jest.fn(),
};

describe('MyController', () => {
  let controller: MyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyController],
      providers: [
        { provide: MyService, useValue: mockMyService },
      ],
    }).compile();

    controller = module.get<MyController>(MyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('myRoute', () => {
    it('should call the service', () => {
      controller.myRoute();
      expect(mockMyService.myMethod).toHaveBeenCalled();
    });
  });
});
```