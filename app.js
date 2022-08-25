const express = require("express");
const app = express();
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

// 在github去申请
const clientId = "YOUR_CLIENT_ID";
const clientSecret = "YOUR_CLIENT_SECRET";

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", express.static("src"));

app.get("/github-login", (req, res) => {
  /**
   * 这里的 redirect_uri 参数是可选的，
   * 首先得确保 `https://github.com/settings/applications/new` 创建OAuth应用的 `Authorization callback URL` 要填写回调地址，
   * 如果不填完整的回调地址，会让验证进行不了下一步
   *  因为 GitHub 在授权成功后会调用该地址
   *
   * scope 参考 `https://docs.github.com/cn/developers/apps/building-oauth-apps/scopes-for-oauth-apps`
   */
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=http://localhost:4000/oauth-callback&scope=repo,user,gist`
    // `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=http://localhost:4000/oauth-callback`
  );
});

/**
 * 当用户访问/github-login时，github OAuth会自动跳转到该地址
 * 前提是在github应用中设置了这个回调地址，或者 在 `https://github.com/login/oauth/authorize` 参数中设置了 `redirect_uri` 参数
 */
app.get("/oauth-callback", async (req, res) => {
  const body = {
    client_id: clientId,
    client_secret: clientSecret,
    code: req.query.code,
  };
  const opts = { headers: { accept: "application/json" } };
  /**
   * 获取access_token
   * 接下来的操作都需要使用access_token
   */
  const response = await axios.post(
    `https://github.com/login/oauth/access_token`,
    body,
    opts
  );
  console.log(response.data);
  /*
  打印:
  {
    access_token: 'gho_Q8kytjwgdwpdwaLwBOEUvbZKn6o6HJ',
    token_type: 'bearer',
    scope: 'user:email'
  }
  */

  // 将access_token保存到变量中
  const token = await response.data["access_token"];
  const userinfo = await axios.get(`https://api.github.com/user`, {
    headers: {
      // 在请求头中添加 Authorization 字段
      Authorization: `token ${token}`,
    },
  });
  console.log(userinfo.data);

  /**
   * 根据access_token获取用户邮箱信息
   */
  const emailinfo = await axios({
    method: "get",
    url: "https://api.github.com/user/emails",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `token ${token}`,
    },
  });
  console.log(emailinfo.data);
  // TODO: 将用户信息和邮箱信息保存到数据库中
  // ...

  // 验证成功，跳转到首页
  res.redirect(`/index.html?login_type=github_oauth`);
  // res.send({
  //   status: 200,
  //   data: {
  //     email: emailinfo.data[0].email,
  //     name: userinfo.data.name,
  //     avatar: userinfo.data.avatar_url,
  //   },
  // });
});

app.listen(4000);
console.log("http://localhost:4000/");
