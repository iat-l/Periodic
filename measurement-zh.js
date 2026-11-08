/* Traditional Chinese content for the measurement course. Lesson bodies are
   swapped as HTML so tables, formulas and the quiz keep their structure. */

const SciLampMeasurementZh = (() => {
  const TITLES = {
    1: '什麼是測量？',
    2: 'SI 單位與字首',
    3: '單位換算：因數標記法',
    4: '準確度與精密度',
    5: '有效數字是什麼？',
    6: '計算中的有效數字',
    7: '四捨五入：快速規則',
    8: '科學記號與有效數字',
    9: '隨堂測驗',
    10: '初學者檢查表',
  };

  const BODIES = {
    1: `
      <p>測量是<strong>一個數字加上一個單位</strong>：</p>
      <blockquote>12.5 cm、3.0 kg、250 mL</blockquote>
      <div class="concept-strip" aria-label="測量由數字、單位與不確定度組成">
        <span class="concept-chip"><small>數字</small><strong>24.3</strong></span>
        <span class="concept-op" aria-hidden="true">+</span>
        <span class="concept-chip"><small>單位</small><strong>mL</strong></span>
        <span class="concept-op" aria-hidden="true">+</span>
        <span class="concept-chip"><small>不確定度</small><strong>&plusmn; 0.1</strong></span>
      </div>
      <p>在化學裡，沒有單位的數字通常沒有意義。每個測量也都帶有<strong>不確定度</strong>：最後一位數字是估計值，或受儀器極限所限。</p>
      <p class="course-example">例：每 1 mL 有刻度的量筒，可以估計到 0.1 mL。你可能讀到 <strong>24.3 mL</strong>，其中的「.3」是估計的。</p>
    `,

    2: `
      <p>化學使用<strong>國際單位制</strong>（SI）。</p>
      <h4>常見的 SI 基本單位</h4>
      <div class="course-table-wrap">
        <table class="course-table">
          <thead><tr><th>物理量</th><th>單位</th><th>符號</th></tr></thead>
          <tbody>
            <tr><td>長度</td><td>公尺</td><td>m</td></tr>
            <tr><td>質量</td><td>公斤</td><td>kg</td></tr>
            <tr><td>時間</td><td>秒</td><td>s</td></tr>
            <tr><td>溫度</td><td>克耳文</td><td>K</td></tr>
            <tr><td>物質的量</td><td>莫耳</td><td>mol</td></tr>
            <tr><td>電流</td><td>安培</td><td>A</td></tr>
            <tr><td>發光強度</td><td>燭光</td><td>cd</td></tr>
          </tbody>
        </table>
      </div>
      <h4>常見的導出單位</h4>
      <div class="course-table-wrap">
        <table class="course-table">
          <thead><tr><th>物理量</th><th>單位</th><th>符號</th></tr></thead>
          <tbody>
            <tr><td>力</td><td>牛頓</td><td>N</td></tr>
            <tr><td>能量</td><td>焦耳</td><td>J</td></tr>
            <tr><td>壓力</td><td>帕斯卡</td><td>Pa</td></tr>
            <tr><td>功率</td><td>瓦特</td><td>W</td></tr>
            <tr><td>體積</td><td>立方公尺</td><td>m<sup>3</sup></td></tr>
            <tr><td>濃度</td><td>體積莫耳濃度</td><td>mol/L = M</td></tr>
          </tbody>
        </table>
      </div>
      <h4>一定要記住的字首</h4>
      <div class="course-table-wrap">
        <table class="course-table">
          <thead><tr><th>字首</th><th>符號</th><th>意義</th></tr></thead>
          <tbody>
            <tr><td>kilo-（千）</td><td>k</td><td>10<sup>3</sup> = 1000</td></tr>
            <tr><td>centi-（厘）</td><td>c</td><td>10<sup>−2</sup> = 1/100</td></tr>
            <tr><td>milli-（毫）</td><td>m</td><td>10<sup>−3</sup> = 1/1000</td></tr>
            <tr><td>micro-（微）</td><td>µ</td><td>10<sup>−6</sup></td></tr>
            <tr><td>nano-（奈）</td><td>n</td><td>10<sup>−9</sup></td></tr>
          </tbody>
        </table>
      </div>
      <p>例子：</p>
      <ul>
        <li>1 km = 1000 m</li>
        <li>1 cm = 0.01 m</li>
        <li>1 mm = 0.001 m</li>
        <li>1 µL = 10<sup>−6</sup> L</li>
        <li>1 nm = 10<sup>−9</sup> m</li>
      </ul>
    `,

    3: `
      <p>使用換算因數，讓單位互相抵消。</p>
      <h4>例 1：把 25 cm 換成公尺</h4>
      <div class="math-block">\\[
25\\ \\text{cm} \\times \\frac{1\\ \\text{m}}{100\\ \\text{cm}} = 0.25\\ \\text{m}
\\]</div>
      <h4>例 2：把 3.5 kg 換成公克</h4>
      <div class="math-block">\\[
3.5\\ \\text{kg} \\times \\frac{1000\\ \\text{g}}{1\\ \\text{kg}} = 3500\\ \\text{g} = 3.5 \\times 10^3\\ \\text{g}
\\]</div>
      <h4>例 3：把 2.0 mL 換成公升</h4>
      <div class="math-block">\\[
2.0\\ \\text{mL} \\times \\frac{1\\ \\text{L}}{1000\\ \\text{mL}} = 0.0020\\ \\text{L}
\\]</div>
      <p class="course-tip"><span><strong>初學者提示：</strong>把單位寫進計算裡。如果不要的單位沒有抵消，就把換算因數倒過來。</span></p>
    `,

    4: `
      <ul>
        <li><strong>準確度</strong>＝測量值與真實值有多接近。</li>
        <li><strong>精密度</strong>＝重複測量彼此有多接近。</li>
      </ul>
      <div class="accuracy-visual" aria-hidden="true">
        <figure class="target-card">
          <span class="target target--tight"><i></i><i></i><i></i><i></i><i></i></span>
          <figcaption>精密，但不準確</figcaption>
        </figure>
        <span class="target-vs">對比</span>
        <figure class="target-card">
          <span class="target target--centre"><i></i><i></i><i></i><i></i><i></i></span>
          <figcaption>既準確又精密</figcaption>
        </figure>
      </div>
      <p>如果儀器校正不良，測量可能很精密卻不準確。</p>
      <p class="course-example">例：同一物體在天平上讀到 5.00 g、5.01 g、4.99 g，但真實質量是 5.50 g。這些測量很精密，卻不準確。</p>
    `,

    5: `
      <p><strong>有效數字</strong>是測量中真正傳達精密度的數字。</p>
      <p>它們包含所有確定的數字，再加上<strong>一位估計數字</strong>。</p>
      <h4>計數規則</h4>
      <div class="course-table-wrap">
        <table class="course-table course-table-wide">
          <thead><tr><th>規則</th><th>例子</th><th>有效數字</th></tr></thead>
          <tbody>
            <tr><td>非零數字都是有效數字</td><td>123</td><td>3</td></tr>
            <tr><td>非零數字之間的 0 是有效數字</td><td>1002</td><td>4</td></tr>
            <tr><td>前導 0 <strong>不是</strong>有效數字</td><td>0.0045</td><td>2</td></tr>
            <tr><td>小數點後的末尾 0 是有效數字</td><td>2.00</td><td>3</td></tr>
            <tr><td>整數末尾的 0、又沒有小數點時，意義不明</td><td>500</td><td>1、2 或 3？</td></tr>
            <tr><td>用科學記號消除不明確</td><td>\\(5.00 \\times 10^2\\)</td><td>3</td></tr>
          </tbody>
        </table>
      </div>
      <p>更多例子：</p>
      <ul>
        <li><strong>0.00450</strong> → 3 位：4、5 與最後的 0 都是有效數字。</li>
        <li><strong>1.050</strong> → 4 位。</li>
        <li><strong>0.02030</strong> → 4 位。</li>
        <li><strong>100.0</strong> → 4 位。</li>
      </ul>
      <p><strong>精確數</strong>有無限多位有效數字。例如：數數得到的物件（12 顆蛋）、定義（1 m = 100 cm）與換算因數。</p>
    `,

    6: `
      <h4>乘法與除法</h4>
      <p>答案的<strong>有效數字位數，與有效數字最少的那個測量相同</strong>。</p>
      <p>例：</p>
      <div class="math-block">\\[
4.56 \\times 1.2 = 5.472
\\]</div>
      <ul>
        <li>4.56 有 3 位有效數字。</li>
        <li>1.2 有 2 位有效數字。</li>
        <li>答案必須有 2 位有效數字。</li>
      </ul>
      <div class="math-block">\\[
5.472 \\rightarrow 5.5
\\]</div>
      <h4>加法與減法</h4>
      <p>答案的<strong>小數位數，與小數位數最少的那個測量相同</strong>。</p>
      <p>例：</p>
      <div class="math-block">\\[
12.11 + 18.0 + 1.013 = 31.123
\\]</div>
      <ul>
        <li>12.11 有 2 位小數。</li>
        <li>18.0 有 1 位小數。</li>
        <li>1.013 有 3 位小數。</li>
      </ul>
      <p>限制值是<strong>1 位小數</strong>，所以：</p>
      <div class="math-block">\\[
31.123 \\rightarrow 31.1
\\]</div>
      <h4>混合運算</h4>
      <p>照順序計算、追蹤有效數字，最後才四捨五入。</p>
      <p>例：</p>
      <div class="math-block">\\[
(2.50 + 1.2) \\times 3.0
\\]</div>
      <p>先做加法：</p>
      <div class="math-block">\\[
2.50 + 1.2 = 3.70 \\rightarrow 3.7
\\]</div>
      <p>再做乘法：</p>
      <div class="math-block">\\[
3.7 \\times 3.0 = 11.1 \\rightarrow 11
\\]</div>
      <p>最後答案有<strong>2 位有效數字</strong>，因為 3.0 有 2 位。</p>
    `,

    7: `
      <p>看第一個要被丟掉的數字：</p>
      <ul>
        <li>如果<strong>小於 5</strong>，保留的最後一位不變。</li>
        <li>如果<strong>大於 5</strong>，保留的最後一位加 1。</li>
        <li>如果正好是<strong>5</strong>，依老師的規則。有些課程用「四捨六入五成雙」，有些用「一律進位」。請與課程保持一致。</li>
      </ul>
      <p>例子：</p>
      <ul>
        <li>5.472 取 2 位有效數字 → <strong>5.5</strong></li>
        <li>31.123 取 1 位小數 → <strong>31.1</strong></li>
        <li>0.004567 取 2 位有效數字 → <strong>0.0046</strong></li>
      </ul>
    `,

    8: `
      <p>科學記號能讓有效數字一目了然。</p>
      <ul>
        <li>\\(5.00 \\times 10^2\\) 有 3 位有效數字。</li>
        <li>\\(5.0 \\times 10^2\\) 有 2 位有效數字。</li>
        <li>\\(5 \\times 10^2\\) 有 1 位有效數字。</li>
      </ul>
      <p>當末尾的 0 意義不明時，就使用科學記號。</p>
    `,

    9: `
      <div class="mcq-summary">
        <span class="asset-ico asset-ico--edit" aria-hidden="true"></span>
        <div class="mcq-summary-copy">
          <strong>十題快速檢查</strong>
          <span>選一個答案。答錯時會給你提示。</span>
        </div>
        <div class="mcq-meter" id="mcq-bar" role="progressbar" aria-label="答對的測驗題數" aria-valuemin="0" aria-valuemax="10" aria-valuenow="0"><span id="mcq-fill"></span></div>
        <span class="mcq-count" id="mcq-count">0 / 10</span>
      </div>
      <ol class="mcq-list" id="mcq-list">
        <li class="mcq" data-mcq="1" data-answer="1" data-hint="前導零只佔位，不計入有效數字。從 3 開始數。" data-explain="3、4 與末尾的 0 都是有效數字，共 3 位。">
          <div class="mcq-head"><span class="mcq-n" aria-hidden="true">01</span><p class="mcq-q" id="mcq-q-1"><strong>0.00340</strong> 有幾位有效數字？</p></div>
          <div class="mcq-options" role="group" aria-labelledby="mcq-q-1">
            <button class="mcq-opt" type="button" data-choice="0"><span class="mcq-key">A</span><span class="mcq-val">2</span></button>
            <button class="mcq-opt" type="button" data-choice="1"><span class="mcq-key">B</span><span class="mcq-val">3</span></button>
            <button class="mcq-opt" type="button" data-choice="2"><span class="mcq-key">C</span><span class="mcq-val">4</span></button>
            <button class="mcq-opt" type="button" data-choice="3"><span class="mcq-key">D</span><span class="mcq-val">5</span></button>
          </div>
          <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
        </li>
        <li class="mcq" data-mcq="2" data-answer="1" data-hint="小數點後的 0 屬於測量值。" data-explain="1、2、0、0 都有效，共 4 位。">
          <div class="mcq-head"><span class="mcq-n" aria-hidden="true">02</span><p class="mcq-q" id="mcq-q-2"><strong>120.0</strong> 有幾位有效數字？</p></div>
          <div class="mcq-options" role="group" aria-labelledby="mcq-q-2">
            <button class="mcq-opt" type="button" data-choice="0"><span class="mcq-key">A</span><span class="mcq-val">3</span></button>
            <button class="mcq-opt" type="button" data-choice="1"><span class="mcq-key">B</span><span class="mcq-val">4</span></button>
            <button class="mcq-opt" type="button" data-choice="2"><span class="mcq-key">C</span><span class="mcq-val">5</span></button>
            <button class="mcq-opt" type="button" data-choice="3"><span class="mcq-key">D</span><span class="mcq-val">6</span></button>
          </div>
          <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
        </li>
        <li class="mcq" data-mcq="3" data-answer="1" data-hint="除以 100，並保留三位有效數字。" data-explain="45.0 cm ÷ 100 = 0.450 m，末尾的 0 保留三位有效數字。">
          <div class="mcq-head"><span class="mcq-n" aria-hidden="true">03</span><p class="mcq-q" id="mcq-q-3">把 <strong>45.0 cm</strong> 換成公尺。</p></div>
          <div class="mcq-options" role="group" aria-labelledby="mcq-q-3">
            <button class="mcq-opt" type="button" data-choice="0"><span class="mcq-key">A</span><span class="mcq-val">0.045 m</span></button>
            <button class="mcq-opt" type="button" data-choice="1"><span class="mcq-key">B</span><span class="mcq-val">0.450 m</span></button>
            <button class="mcq-opt" type="button" data-choice="2"><span class="mcq-key">C</span><span class="mcq-val">4.50 m</span></button>
            <button class="mcq-opt" type="button" data-choice="3"><span class="mcq-key">D</span><span class="mcq-val">450 m</span></button>
          </div>
          <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
        </li>
        <li class="mcq" data-mcq="4" data-answer="1" data-hint="乘以 1000，體積會變大。" data-explain="0.750 L × 1000 = 750. mL，或 7.50 × 10² mL。">
          <div class="mcq-head"><span class="mcq-n" aria-hidden="true">04</span><p class="mcq-q" id="mcq-q-4">把 <strong>0.750 L</strong> 換成毫升。</p></div>
          <div class="mcq-options" role="group" aria-labelledby="mcq-q-4">
            <button class="mcq-opt" type="button" data-choice="0"><span class="mcq-key">A</span><span class="mcq-val">75.0 mL</span></button>
            <button class="mcq-opt" type="button" data-choice="1"><span class="mcq-key">B</span><span class="mcq-val">750. mL</span></button>
            <button class="mcq-opt" type="button" data-choice="2"><span class="mcq-key">C</span><span class="mcq-val">7,500 mL</span></button>
            <button class="mcq-opt" type="button" data-choice="3"><span class="mcq-key">D</span><span class="mcq-val">0.0750 mL</span></button>
          </div>
          <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
        </li>
        <li class="mcq" data-mcq="5" data-answer="2" data-hint="限制測量只有兩位有效數字。" data-explain="2.5 × 3.42 = 8.55，四捨五入為 8.6。">
          <div class="mcq-head"><span class="mcq-n" aria-hidden="true">05</span><p class="mcq-q" id="mcq-q-5">計算並四捨五入：<strong>2.5 × 3.42</strong></p></div>
          <div class="mcq-options" role="group" aria-labelledby="mcq-q-5">
            <button class="mcq-opt" type="button" data-choice="0"><span class="mcq-key">A</span><span class="mcq-val">8.5</span></button>
            <button class="mcq-opt" type="button" data-choice="1"><span class="mcq-key">B</span><span class="mcq-val">8.55</span></button>
            <button class="mcq-opt" type="button" data-choice="2"><span class="mcq-key">C</span><span class="mcq-val">8.6</span></button>
            <button class="mcq-opt" type="button" data-choice="3"><span class="mcq-key">D</span><span class="mcq-val">9.0</span></button>
          </div>
          <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
        </li>
        <li class="mcq" data-mcq="6" data-answer="2" data-hint="對齊小數位；0.3 只有一位小數。" data-explain="10.0 + 2.55 + 0.3 = 12.85，四捨五入為 12.9。">
          <div class="mcq-head"><span class="mcq-n" aria-hidden="true">06</span><p class="mcq-q" id="mcq-q-6">計算並四捨五入：<strong>10.0 + 2.55 + 0.3</strong></p></div>
          <div class="mcq-options" role="group" aria-labelledby="mcq-q-6">
            <button class="mcq-opt" type="button" data-choice="0"><span class="mcq-key">A</span><span class="mcq-val">12.8</span></button>
            <button class="mcq-opt" type="button" data-choice="1"><span class="mcq-key">B</span><span class="mcq-val">12.85</span></button>
            <button class="mcq-opt" type="button" data-choice="2"><span class="mcq-key">C</span><span class="mcq-val">12.9</span></button>
            <button class="mcq-opt" type="button" data-choice="3"><span class="mcq-key">D</span><span class="mcq-val">13.0</span></button>
          </div>
          <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
        </li>
        <li class="mcq" data-mcq="7" data-answer="1" data-hint="密度是質量除以體積。" data-explain="12.5 ÷ 5.0 = 2.5 g/mL；兩個測量都只有兩位有效數字。">
          <div class="mcq-head"><span class="mcq-n" aria-hidden="true">07</span><p class="mcq-q" id="mcq-q-7">樣品質量 <strong>12.5 g</strong>、體積 <strong>5.0 mL</strong>。密度是多少？</p></div>
          <div class="mcq-options" role="group" aria-labelledby="mcq-q-7">
            <button class="mcq-opt" type="button" data-choice="0"><span class="mcq-key">A</span><span class="mcq-val">0.40 g/mL</span></button>
            <button class="mcq-opt" type="button" data-choice="1"><span class="mcq-key">B</span><span class="mcq-val">2.5 g/mL</span></button>
            <button class="mcq-opt" type="button" data-choice="2"><span class="mcq-key">C</span><span class="mcq-val">2.50 g/mL</span></button>
            <button class="mcq-opt" type="button" data-choice="3"><span class="mcq-key">D</span><span class="mcq-val">62.5 g/mL</span></button>
          </div>
          <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
        </li>
        <li class="mcq" data-mcq="8" data-answer="1" data-hint="把小數點向右移五位，再取兩位有效數字。" data-explain="0.0000567 = 5.67 × 10⁻⁵，四捨五入為 5.7 × 10⁻⁵。">
          <div class="mcq-head"><span class="mcq-n" aria-hidden="true">08</span><p class="mcq-q" id="mcq-q-8">用科學記號表示 <strong>0.0000567</strong>，取 2 位有效數字。</p></div>
          <div class="mcq-options" role="group" aria-labelledby="mcq-q-8">
            <button class="mcq-opt" type="button" data-choice="0"><span class="mcq-key">A</span><span class="mcq-val">5.67 × 10<sup>−5</sup></span></button>
            <button class="mcq-opt" type="button" data-choice="1"><span class="mcq-key">B</span><span class="mcq-val">5.7 × 10<sup>−5</sup></span></button>
            <button class="mcq-opt" type="button" data-choice="2"><span class="mcq-key">C</span><span class="mcq-val">5.7 × 10<sup>−4</sup></span></button>
            <button class="mcq-opt" type="button" data-choice="3"><span class="mcq-key">D</span><span class="mcq-val">57 × 10<sup>−6</sup></span></button>
          </div>
          <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
        </li>
        <li class="mcq" data-mcq="9" data-answer="3" data-hint="沒有小數點時，末尾的 0 可能只是佔位。" data-explain="沒有小數點時，500 的有效位數不明確；用科學記號才能說清楚。">
          <div class="mcq-head"><span class="mcq-n" aria-hidden="true">09</span><p class="mcq-q" id="mcq-q-9">沒有小數點的 <strong>500</strong> 有幾位有效數字？</p></div>
          <div class="mcq-options" role="group" aria-labelledby="mcq-q-9">
            <button class="mcq-opt" type="button" data-choice="0"><span class="mcq-key">A</span><span class="mcq-val">一定是 1 位</span></button>
            <button class="mcq-opt" type="button" data-choice="1"><span class="mcq-key">B</span><span class="mcq-val">一定是 2 位</span></button>
            <button class="mcq-opt" type="button" data-choice="2"><span class="mcq-key">C</span><span class="mcq-val">一定是 3 位</span></button>
            <button class="mcq-opt" type="button" data-choice="3"><span class="mcq-key">D</span><span class="mcq-val">不明確——用科學記號表示</span></button>
          </div>
          <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
        </li>
        <li class="mcq" data-mcq="10" data-answer="2" data-hint="攝氏溫度加 273.15。" data-explain="25 + 273.15 = 298.15 K；以兩位有效數字表示為 298 K。">
          <div class="mcq-head"><span class="mcq-n" aria-hidden="true">10</span><p class="mcq-q" id="mcq-q-10">把 <strong>25 °C</strong> 換成克耳文。</p></div>
          <div class="mcq-options" role="group" aria-labelledby="mcq-q-10">
            <button class="mcq-opt" type="button" data-choice="0"><span class="mcq-key">A</span><span class="mcq-val">248 K</span></button>
            <button class="mcq-opt" type="button" data-choice="1"><span class="mcq-key">B</span><span class="mcq-val">273 K</span></button>
            <button class="mcq-opt" type="button" data-choice="2"><span class="mcq-key">C</span><span class="mcq-val">298 K</span></button>
            <button class="mcq-opt" type="button" data-choice="3"><span class="mcq-key">D</span><span class="mcq-val">323 K</span></button>
          </div>
          <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
        </li>
      </ol>
      <div class="mcq-foot">
        <span class="mcq-foot-note" id="mcq-note">答案保存在此裝置。</span>
        <button class="course-cta is-quiet" id="mcq-clear" type="button">清除測驗答案</button>
      </div>
    `,

    10: `
      <ul class="course-checklist">
        <li>永遠寫出<strong>單位</strong>。</li>
        <li>用<strong>換算因數</strong>讓單位抵消。</li>
        <li>正確計算有效數字：前導 0 <strong>不</strong>計入。</li>
        <li>乘除 → 取<strong>有效數字</strong>最少者。</li>
        <li>加減 → 取<strong>小數位數</strong>最少者。</li>
        <li>多步計算只在<strong>最後</strong>四捨五入。</li>
        <li>用科學記號避免意義不明。</li>
        <li>記住：測量帶有<strong>不確定度</strong>，有效數字表達這份精密度。</li>
      </ul>
    `,
  };

  function render(originalHtml) {
    const holder = document.createElement('div');
    holder.innerHTML = originalHtml;
    holder.querySelectorAll('.lesson').forEach((lesson) => {
      const id = Number(lesson.dataset.lesson);
      const title = lesson.querySelector('.lesson-title');
      const body = lesson.querySelector('.lesson-body');
      if (title && TITLES[id]) title.textContent = TITLES[id];
      if (body && BODIES[id]) body.innerHTML = BODIES[id];
    });
    return holder.innerHTML;
  }

  return { render };
})();

window.SciLampMeasurementZh = SciLampMeasurementZh;
