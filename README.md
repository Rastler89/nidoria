# 🐜 Nidoria

**Nidoria** es un juego de estrategia multijugador ambientado en un mundo de hormigas, desarrollado con **NestJS** para el backend y **Prisma** como ORM para la base de datos.  
Este repositorio contiene la API, incluyendo autenticación JWT, registro/login de usuarios y funcionalidades en tiempo real (próximamente).

---

## 🚀 Tecnologías usadas

- [NestJS](https://nestjs.com/) — Framework backend para Node.js
- [Prisma](https://www.prisma.io/) — ORM para manejar la base de datos
- [MySQL](https://www.mysql.com/) — Base de datos relacional
- [JWT](https://jwt.io/) — Autenticación basada en tokens
- [Socket.IO](https://socket.io/) — Comunicación en tiempo real *(pendiente)*

---

## 📅 Próximas funciones

- Comunicación en tiempo real con Socket.IO
- Gestión de partidas multijugador
- Persistencia de estado de juego
- Chat entre jugadores
- Gestión del hormiguero

## 📚 Documentación

## Como empezar

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno
4. Iniciar el servidor: `npm run start`
5. Ejecutar la generacion de prisma: `npx prisma generate`
6. Ejecutar la migracion de prisma: `npx prisma migrate dev`
7. Ejecutar la semilla de prisma: `npm run seed`
8. Iniciar el servidor: `npm run start:dev`
9. Iniciar el servidor de tareas: `npm run start:worker`
