# watermelon-db-plugin-jsi 🍉

Patched config plugin to auto configure `@nozbe/watermelondb`

Originally published by `morrowdigital` (https://github.com/morrowdigital/watermelondb-expo-plugin), forked from `@milvoj/watermelondb-expo-plugin` (https://github.com/milvoj/watermelondb-expo-plugin)

## Install

```
npm i @domi7891/watermelondb-expo-plugin
```

After installing this npm package, add the [config plugin](https://docs.expo.io/guides/config-plugins/) to the [`plugins`](https://docs.expo.io/versions/latest/config/app/#plugins) array of your `app.json` or `app.config.js`. Then rebuild your app as described in the ["Adding custom native code"](https://docs.expo.io/workflow/customizing/) guide.

## Example

In your app.json `plugins` array add:

```json
{
  "plugins": [
    [
      "expo-build-properties",
      {
        "android": {
          "packagingOptions": {
            "pickFirst": ["**/libc++_shared.so"]
          }
        }
      }
    ],
    "@domi7891/watermelondb-expo-plugin"
  ]
}
```
