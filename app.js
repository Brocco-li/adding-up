'use strict';

const fs = require('fs');
// FileSystemを扱うためのモジュールを呼び出してfsオブジェクトを作成。
const readline = require('readline');
// ファイルを1行ずつ読むためのreadlineモジュールを呼び出し、readlineオブジェクトを作成。
const rs = fs.createReadStream('./popu-pref.csv');
// csvファイルからファイルの読み込みを行うStreamを生成。
const rl = readline.createInterface({ input: rs, output: {} });
// rsをreadlineオブジェクトのinputとして設定し、rlオブジェクトを作成。
// rlはrs（ストリーム）の監視員みたいな感じか
const prefectureDataMap = new Map();  // key: 都道府県 value: 集計データのオブジェクト

// rlオブジェクトでlineというイベントが発生したら、無名関数を実行
// 無名関数（アロー関数）は引数が一つしかない時、引数 => {処理}と書くことができる
// 'line'というイベントは1行読んだということ
// モジュールごとにイベント（出来事、合図？）は予め決められている
rl.on('line', lineString => {
    const columns = lineString.split(',');
    const year = parseInt(columns[0]);
    const prefecture = columns[1];
    // columns[2]を含んでないのは10~14歳のデータは必要ないから
    const popu = parseInt(columns[3]);
    
    // CSVのヘッダーではなくデータ部分のみに処理を行うためif文を書いた
    if (year === 2010 || year === 2015) {
        let value = prefectureDataMap.get(prefecture);
        // prefectureをキーとするmapの値をvalueに入れる
        // 1巡目(2010)ではまだ登録されてないので、undefinedとなる
        // ↓1巡目(2010)のときに実行される。
        if (!value) {
            // valueに初期値となるオブジェクトを代入
            value = {
                popu10: 0,
                popu15: 0,
                change: null
            };
        }
        if (year === 2010) {
            value.popu10 = popu;
        }
        if (year === 2015) {
            value.popu15 = popu;
        }
        prefectureDataMap.set(prefecture, value);
    }
});

// 全てのデータを読み終わったとき
rl.on('close', () => {
    for (let [key, value] of prefectureDataMap) {
        value.change = value.popu15 / value.popu10;
    }
    // 変化率を計算
    // for-of構文: 配列やMapの中身を取り出してループを回す
    // 分割代入: [key, value]とすることでキーと値がそこに入る

    const rankingArray = Array.from(prefectureDataMap).sort((pair1, pair2) => {
        return pair2[1].change - pair1[1].change;
    });
    // sort(比較関数)、比較関数は並び替えの条件を与える
    // pair1, pair2は配列の任意の要素、[都道府県名, {valueオブジェクト}]が入っている
    // pair1[1]は値オブジェクトで.changeは変化率を指す
    // 要はpair1とpair2を比較して大きい方を前にしている
    
    const rankingStrings = rankingArray.map(([key, value]) => {
        return (
            key +
            ': ' +
            value.popu10 +
            '=>' +
            value.popu15 +
            ' 変化率:' +
            value.change
        );
    });
    // map関数: 配列の要素に処理を加えて新たな配列を作る。連想配列のMapとは異なる
    // 文字列と足し算しているので、文字列が返される
    console.log(rankingStrings);
});