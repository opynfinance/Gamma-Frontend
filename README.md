<h1 align="center">
Opyn Gamma Frontend
</h1>

<h3 align="center">
Opyn's interface for users to access Gamma Protocol options
</h3>

[![Netlify Status](https://api.netlify.com/api/v1/badges/7d799e0b-2a32-46b1-8bdd-6a4893b9542b/deploy-status)](https://app.netlify.com/sites/opyn-redesign/deploys)  [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Getting started

As the first step, install the node dependencies

```
yarn install
```

### Set up the environment

Copy the contents of `.env.example` to a new file `.env`. 

`REACT_APP_INFURA_API_KEY` - Sign up in [Infura](https://infura.io/dashboard/ethereum) and create an Ethereum project to get infura key.
`REACT_APP_BLOCKNATIVE_DAPP_ID` - Sign up in [Blocknative](https://www.blocknative.com/) and get the api key.

You can leave rest of the values as it is.

### Run the app

Once everything is set run the following command.

```
yarn start
```

## Contributions
We welcome contributions to the Gamma Frontend! You can contribute by resolving existing issues, taking on feature requests, and refactoring code. Please feel free to open new issues / feature requests as well. If you have questions about contributing, ping us on #dev in the [Opyn discord](http://tiny.cc/opyndiscord) :)

## Available Scripts

In the project directory, you can run:

### React App

#### `yarn react-app:start`

Runs the React app in development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will automatically reload if you make changes to the code.<br>
You will see the build errors and lint warnings in the console.

#### `yarn react-app:test`

Runs the React test watcher in an interactive mode.<br>
By default, runs tests related to files changed since the last commit.

[Read more about testing React.](https://facebook.github.io/create-react-app/docs/running-tests)

#### `yarn react-app:build`

Builds the React app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the React documentation on [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### `yarn react-app:eject`

**Note: this is a one-way operation. Once you `react-app:eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` the React app at any time. This command will
remove the single build dependency from your React package.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right
into the `react-app` package so you have full control over them. All of the commands except `react-app:eject` will still work,
but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `react-app:eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Branding 
Don't use the Opyn logo or name in anything dishonest or fraudulent. If you deploy another version of the interface, please make it clear that it is an interface to the Gamma Protocol, but not affiliated with Opyn Inc.


