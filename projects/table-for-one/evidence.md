# 費用・公開状態・根拠資料

記録日：2026-11-24。制作時のログとユーザーのレビューを整理したものです。

## 状態の記録

| 項目 | 状態 | 根拠 |
|---|---|---|
| 英語／日本語字幕の完成書き出し | 完了 | ローカルMP4と検証記録 |
| 公式透かし・エンド映像付き書き出し | 完了 | contest-release/publication-handoff.json |
| YouTube公開 | ユーザーが公開済み | 提供URL、oEmbedの作品名・チャンネル一致。全編ログアウト再生・年齢制限は未確認 |
| Higgsfieldプロジェクト公開 | 確認済み | 最新スクリーンショットに緑チェック、「You're creating in public」と公開URL |
| コンテスト応募一覧への掲載 | 確認済み（2026-11-24） | ユーザーの投稿確認報告とスクリーンショット。Talent Contest SubmissionsにTABLE FOR ONE／velichan／3:08を表示。適格性審査通過や最終候補選出の確認ではない |
| 受賞、再生の伸び、収益 | 未確認 | 成果を主張できる数字なし |

旧版のSUBMISSION-NOTESにある「未公開」「ブランディング未完」は、その版の作成時点の状態。最新のpublication-handoff.jsonと公開完了画面を優先する。
旧企画名DO NOT REPLAYと最終タイトルTABLE FOR ONEを区別する。

## 確認できた費用の一部

| 作業 | 記録された消費 | 範囲 |
|---|---:|---|
| 3コマ絵コンテ参照の13秒下書き一式 | 41.25 Higgsfieldクレジット | storyboard-test-v1/REVIEW.md |
| 静止画参照と動画参照の比較一式 | 45.75 Higgsfieldクレジット | element-ab-v1/REVIEW.md |
| 最後の空席追加試作 | 12.75 Higgsfieldクレジット | 画像0.75＋不採用6秒動画12 |
| 最後の椅子の音 | 33 character units | ElevenLabsの記録単位。現金額は不明 |

上記は一部の工程。全編の総制作費ではなく、これらを足して総額としない。現金総額・総作業時間も未集計。クレジットから円・ドルへの換算は契約条件の確認後に行う。

## 画質と検証の限界

最終書き出しは1920×1080。本編の素材には低いネイティブ解像度のテイクや編集上のクロップも含む。「すべてネイティブ1080p生成」とは表現しない。
最終v5は本編＋クレジット188秒、24fps。公式エンド込みYouTube用は約200.366秒、30fps。
全編デコード・音声ピーク・同期等の検査は、演技・音質・恐怖の人間による評価を代替しない。

## 元データへの案内

以下は制作者が保管する元データの相対パス一覧です。このリポジトリ内のリンクではなく、元映像・ログ自体は含まれていません。

| 相対パス | 内容 |
|---|---|
| storyboard-test-v1/REVIEW.md | 棚と包丁の修正。4fps抽出＋問題区間のフレーム確認 |
| element-ab-v1/REVIEW.md | A/Bの観察とテストの限界 |
| memory-motion-v1/、memory-motion-v2/ | 記憶カットの比較候補 |
| finish-v3/REVIEW.md | フェード・編集上の寄り・音の再配置 |
| final-v2/ | 血の手洗い |
| final-v3/、final-v4/ | 冒頭連続ショット、説明削除、肉の寄り、笑み、重複削除、タイトル中央化 |
| final-v5/SUBMISSION-NOTES.md | 空席の動くテイクを捨てた理由と費用 |
| final-v5/completion-report.json | タイムラインと検証情報 |
| contest-release/publication-handoff.json | 最新の公開状態 |
| contest-release/project-publication-success-20261124.png | ユーザー提供のプロジェクト公開成功画面 |
| contest-release/contest-listing-confirmed-20261124.png | ユーザー提供のコンテスト応募一覧掲載画面 |
| contest-release/folder-organization-result.json | 97件の分類結果 |
| table-for-one-contest-en.mp4 | YouTube用完成版 |
| table-for-one-final-v5-en.mp4 | 公式ブランディング追加前188秒版 |
| contest-release/thumbnail-horror-v2.jpg | 承認サムネイル。外部画像生成で制作 |

元ログには内部IDや一時URLが含まれるため、そのまま公開用資料に転記しない。APIキー・認証情報はこの保存物に含めない。上記素材すべてをGitHubへアップロードしたわけではない。

## Xへ伝える軸

完成映像だけでなく「扉が閉まらない→3コマ参照→確認できた修正」と「皿が滑る→動かさず音で見せる」を比較する。
対応する失敗と修正後の実物を照合してから切り出す。核心を先に見せず、ネタバレの少ない告知と後日の制作解説を分ける。
投稿案はユーザーに提示してから公開。制作記録の保存を、X投稿承認やコンテスト応募完了と取り違えない。
