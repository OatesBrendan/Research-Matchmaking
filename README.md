# CAB398 T325 Project 378 - Research Scraper Application

A web application that scrapes research publications and displays then in a force directed graph.

<a href="https://github.com/rhilt16/CAB398ResearchMatchmaking/blob/888650b6c7645bd3bdcdf6bb74220ee8ce5de792/media/graph-preview.png"><img src="https://github.com/rhilt16/CAB398ResearchMatchmaking/blob/888650b6c7645bd3bdcdf6bb74220ee8ce5de792/media/graph-preview.png" width="49.5%"/></a> <a href="https://github.com/rhilt16/CAB398ResearchMatchmaking/blob/888650b6c7645bd3bdcdf6bb74220ee8ce5de792/media/browser-preview.png"><img src="https://github.com/rhilt16/CAB398ResearchMatchmaking/blob/888650b6c7645bd3bdcdf6bb74220ee8ce5de792/media/browser-preview.png" width="49.5%"/></a> <a href="https://github.com/rhilt16/CAB398ResearchMatchmaking/blob/888650b6c7645bd3bdcdf6bb74220ee8ce5de792/media/scrape-preview.png"><img src="https://github.com/rhilt16/CAB398ResearchMatchmaking/blob/888650b6c7645bd3bdcdf6bb74220ee8ce5de792/media/scrape-preview.png" width="49.5%"/></a> <a href="https://github.com/rhilt16/CAB398ResearchMatchmaking/blob/6edc9f1af3f7eab2c259bbcd06046f4a2ba377d8/media/scraper-dashboard-preview.png"><img src="https://github.com/rhilt16/CAB398ResearchMatchmaking/blob/6edc9f1af3f7eab2c259bbcd06046f4a2ba377d8/media/scraper-dashboard-preview.png" width="49.5%"/></a>


## Project Structure
```
research-scraper/
├── backend/                  # Express Backend Server
|   ├── config/               # Contains initialization for services used by backend (database connection and transporter)
│   ├── controllers/          # The functionality for each route
│   ├── docs/                 # Swagger docs for Express REST API
│   ├── middleware/           # Middleware for authorisation and error handling 
│   ├── models/               # The defined models for the database
│   ├── node_modules/         # Module files installed according to package-lock.json and package.json
│   ├── routes/               # All the routes of the server
|   ├── utils/                # Contains utility functions such as the web scraper
│   ├── .gitignore            # Defines directories for github commits to ignore
│   ├── app.js                # Main express app / base route 
│   └── server.js             # The main script serving the express server 
|
└── research-app/             # React frontend
    ├── node_modules/         # Module files installed according to package-lock.json and package.json
    ├── public/               # Public assets to be used for the front end
    ├── src/                  # React source code
    ├── package.json          # Node.js dependencies
    └── ...
```

## Email Setup
1. Create a gmail account

2. Activate 2 Factor Authentication

3. visit [this site](myaccount.google.com/apppasswords) to generate an app password, it doesn't matter what the app is called

4. Update the values in the .env file:

```
EMAIL=YOUR_EMAIL
EMAIL_CONNECTION_PASSWORD=APP_PASSWORD
```

5. If successful, a successful connection message will be logged to the console, otherwise an error message will be sent

## MongoDB Connection (Existing Cluster)
1. Login to the dedicated gmail account, details in .env

```
EMAIL=example@email.com
EMAIL_ADMIN_PASS=lotsofletters
```

2. Make sure you can access the Gmail inbox, as you will be prompted for a verification email when you try to access the [MongoDB Atlas](https://cloud.mongodb.com/v2/68145c453597c2798e65c16f#/overview)

3. Visit the [MongoDB Atlas](https://cloud.mongodb.com/v2/68145c453597c2798e65c16f#/overview), and enter the details stored in the .env. The details will be the same as for logging in to the gmail.

4. To view the data stored in the database, click on the 'Browse collections' button, and click any collection located under 'ResearchDB'.

5. (Optional) To get a new connection string, click on 'Connect' located above the 'Browse collections' button, then on 'Drivers', and follow those steps. Copy the final connection string, ensuring its formatted like is required (an example is already in the .env). Replace like below

```
ATLAS_URI=mongodb+srv://<user>:<password>@<more-app-stuff>
```

## MongoDB Connection (New)
1. Visit the [MongoDB Atlas](https://account.mongodb.com/account/register?signedOut=true)

2. Create an account and then navigate to the [Overview Page](https://cloud.mongodb.com/v2/68145c453597c2798e65c16f#/overview) to create a new cluster

3. Follow the steps outlined [here](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/) and select the 'Atlas UI' option. Select the AWS provider

4. After creating and deploying the cluster, to obtain a connection string, follow these steps:
- Click on 'Connect' located above the 'Browse collections' button, then on 'Drivers'. 
- Copy the final connection string, ensuring its formatted like is required (an example is already in the .env). Replace like below
```
ATLAS_URI=mongodb+srv://<user>:<password>@<more-app-stuff>
```
5. (Optional) To use the connection string you may have to create a user, and include the credentials, as in the 'user' and 'password' part of the string. 
- To do this, you have to use the navbar on the left side of the screen, and navigate to the 'Data and Network Access' subheading under the 'Security' Heading.
- On this page, click the 'ADD NEW DATABASE USER' and complete it with the following information

   | Attribute | Value |
   | --- | --- |
   | username | 'your_username' |
   | password | 'your_password' |
   | Database User Privileges | Built-in Role |
   | Built-in Role | Atlas admin |
   | Restrict Access to Specific Clusters/Federated Database Instances/Stream Processing Instances | False |
   | Temporary User | False | 

- Fill in the username and password in the connection string.


## Setup Instructions
0. Install docker from: https://docs.docker.com/desktop/setup/install/windows-install/
1. Create the `.env` file in `./backend`:
   ```
   # Example ./backend/.env:
   ATLAS_URI=YOUR_MONGO_ATLAS_URL
   PORT=YOUR_PORT_NUMBER
   EMAIL=YOUR_EMAIL
   EMAIL_CONNECTION_PASSWORD=YOUR_EMAIL_PASSWORD
   JWT_SECRET=YOUR_JWT_SECRET
   ```
2.1 If deploying on same machine:
   - Set the values in root `./env` to match your requirements
   ```
   # Example Set Up of ./env:
   BACKEND_PORT=8080
   FRONTEND_PORT=80
   REACT_APP_ENDPOINT=http://localhost:8080
   ```
2.2 If on Different Machines:
   - Set the values in each programs `.env` file to match your requirements
   - Ensure that front end's `REACT_APP_ENDPOINT` is set to the url of the `backend` endpoint
3. Run the `compose.yaml` scripts:
   - Same Machine (in root directory):
      ```
      docker compose up --build -d
      ```
      Where `--build` builds the instance, so if nothing has changed this can be left out. And `-d` runs it detatched.
      To run or rebuild a particular one:
      ```
      docker compose up --build -d frontend
      # or
      docker compose up --build -d backend
      ```
   - Different Machine:
      Navigate to `./backend` or `./research-app` and run:
      ```
      docker compose up --build -d
      ```
      Where `--build` builds the instance, so if nothing has changed this can be left out. And `-d` runs it detatched.
4. If using Docker Desktop you can manage the running containers there and delete, stop, pause, and start the instances.
5. A file has been added in media to help get the database filled with some researchers (list used in examples): <a href="https://github.com/rhilt16/CAB398ResearchMatchmaking/blob/22a1f82bbd5d797b6048ed73d82b5702ff63f3be/media/researchers.json">List of Orcids</a>
    - You can upload this directly into a batch scrape job to start scraping for these researchers.
6. To create an admin user, the only good way of going about it when no researchers are present in the database is to manually add one through MongoDB (can be done in vs code with mongodb extention easily):
    - using mongodb playground you can:
    - Navigate to mongodb extention
    - Connect to the mongodb atlas using same connection string as the backend
    - Navigate to the database you are using
    - After backend has started it should have created multiple tables, go to the users table
    - Right click and select insert document
    - You can then run this to insert a test admin (you should delete it before deployment):
    ```
    use('ResearchDB'); // replace with name of your db
    // Create a new document in the collection.
    db.getCollection('users').insertOne({
            "name": "admin",
            "email": "example@xyz.com",
            "password": "$2a$10$wz51WgUCx24LbNi3PASJM.Qqrb2K8fxEr555xkgFlOFzJejcYFvSi", // hash for "pass"
            "isAdmin": true,
    });
    ```
