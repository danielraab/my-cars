## basic help

- JWT Authentication: https://www.bezkoder.com/node-js-jwt-authentication-mysql/

## development

### local npm

- clone the repository
- install modules `npm install`
- start development server `npm run dev`

### local docker

- start dev stack `docker-compose -f development.docker-compose.yml up`
- execute manual commands in container: `docker exec -it {{container_name}} sh`

  - alternative for sequelizer db creation:
    - add module: `sequelize model:create --name users --attributes firstName:string,lastName:string,username:string,password:string,email:string,phoneNumber:string,gender:string,status:boolean`
    - execute migrate: `npx sequelize-cli db:migrate` -> not working for sqlite file
    - add seed: `sequelize seed:generate --name users`

#### execute migration

- migration is called in `./docker/development.entrypoint.sh`

#### execute seeder

- go into container `docker exec -it mycar_my-car_1 sh`
- execute `npx sequelize-cli db:seed:all`

- remove all seeded values: `npx sequelize-cli db:seed:undo:all`

## production

### production deployment

- clone repo
- copy `.env` to `.env.local` and alter to your needs
- copy `production.docker-compose.yml` to `docker-compose.yml` and alter to your needs
- start production stack `docker-compose up -d`
- for redeployment use `docker-compose up -d --build`
  - or split: `docker-compose build` and `docker-compose up -d my-car`
  - add network if neccessary: `docker network conntect npm_external my-car-nextjs_my-car_1`
