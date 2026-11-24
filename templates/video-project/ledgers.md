# 管理表の記入方法

## takes.csv

1行＝1出力テイク。take_idとshot_idは必須。同じ生成リクエストから複数出力された場合はrequest_idを共有。
参照画像・プロンプト・設定の版を残し、素材のネイティブ解像度と書き出し解像度を区別する。未取得のseed等は空欄。
status: draft / review / accepted / rejected。cost_record_idで費用行と関連付ける。

## costs.csv

1行＝1課金記録。複数テイクで共有するリクエスト料金を重複記入しない。部分返金はrefund_unitsへ記録。
unitはHiggsfield creditsなどサービスを含める。status: estimated / confirmed / unknown。
additional_cashは今回新たに払った金額。クレジットの利用だけなら現金支出と別扱い。0は確認できたゼロのみ、分からない値は空欄にしてnotesへ「不明」。
billing_basisには追加購入、無料枠、月額内などを記載。料金表からの換算は仮定と確認日をnotesに書く。

## time-log.csv

start_iso/end_isoはタイムゾーン付き。active_minutesは人の実作業、waiting_minutesは待ち時間。並行作業はparallel_groupでまとめ、経過時間と区別して集計。

CSVはヘッダーだけの空テンプレートです。カンマを含む値は二重引用符で囲む。公開用には領収書や内部参照をそのまま貼らず、確認済みの集計と公開可能な出典だけを載せてください。
