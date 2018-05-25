## Push file to kindle

## Usage

```bash
git clone https://github.com/earthfor/push2kindle.git
cd push2kindle
npm i
npm run dev
```

## Example

```js
fetch('http://localhost:3000', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    data: JSON.stringify({
        url: 'http://example.com/a.zip'   //  file url
        to: 'to@mail.com'
    })
})
```
