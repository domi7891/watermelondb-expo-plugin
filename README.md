# watermelon-db-plugin 🍉
Patched config plugin to auto configure `@nozbe/watermelondb`

Originally published by `morrowdigital` (https://github.com/morrowdigital/watermelondb-expo-plugin)


## Install

```
npm i @milvoj/watermelondb-expo-plugin
```

After installing this npm package, add the [config plugin](https://docs.expo.io/guides/config-plugins/) to the [`plugins`](https://docs.expo.io/versions/latest/config/app/#plugins) array of your `app.json` or `app.config.js`. Then rebuild your app as described in the ["Adding custom native code"](https://docs.expo.io/workflow/customizing/) guide.

## Example

In your app.json `plugins` array:

```json
{
  "plugins": ["@milvoj/watermelondb-expo-plugin"]
}
```
