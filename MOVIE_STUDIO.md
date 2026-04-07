# Movie Studio

`docker-compose.movie.yml` で `voicevox/voicevox_engine` と `movie-studio` `youtube-publisher` を分離しています。

ローカル手動実行:
1. `.env` に `FIREBASE_API_KEY` `FIREBASE_PROJECT_ID` `FIREBASE_BLOG_COLLECTION` `VOICEVOX_SPEAKER_ID` を設定
2. 動画生成を実行: `./scripts/render-movies-in-container.sh`
3. 生成物を確認: `artifacts/movie-studio/<YYYYMMDD>-<postId>/`
4. YouTube 投稿まで行う場合: `./scripts/publish-movies-in-container.sh artifacts/movie-studio/<YYYYMMDD>-<postId>/rendered-bundle.json`

ローカルで動画だけ作る場合:
`./scripts/render-movies-in-container.sh`

長尺だけ:
`./scripts/render-movies-in-container.sh long`

生成結果:
`artifacts/movie-studio/<YYYYMMDD>-<postId>/`

YouTube 投稿:
`./scripts/publish-movies-in-container.sh artifacts/movie-studio/<YYYYMMDD>-<postId>/rendered-bundle.json`

GitHub Actions では `.github/workflows/movie.yaml` が render 後に publish を行います。失敗時は job を落とし、`ADMIN_NOTIFICATION_WEBHOOK_URL` があれば通知します。
