import { useState } from 'react';
import Header from '../components/Header';
import styles from './HomePage.module.scss';
import { Progress, Button } from '@chakra-ui/react';
import teacherpic from '../assets/teacher.png';
import folderpic from '../assets/folder.png';
import servicepic from '../assets/service.png';
import dashboardpic from '../assets/dashboard.png';

const HomePage = () => {
  // eslint-disable-next-line no-unused-vars
  const [step, setStep] = useState(1);

  const maxSteps = 5;
  const percent = (step / maxSteps) * 100;

  return (
    <>
      <Progress.Root value={percent} max={100} maxW="1041px">
        <Progress.Track bg="black" borderRadius="6px" h="4px" overflow="hidden">
          <Progress.Range bg="yellow.400" transition="width 300ms ease" />
        </Progress.Track>
      </Progress.Root>

      {/* <div style={{ marginTop: 12 }}>
        <button onClick={() => setStep((s) => Math.max(0, s - 1))}>Prev</button>
        <button onClick={() => setStep((s) => Math.min(maxSteps, s + 1))}>Next</button>
        <span style={{ marginLeft: 12 }}>
          {step}/{maxSteps}
        </span>
      </div> */}
      <div className={styles.top_cont}>
        <div className={styles.top_inner_cont}>
          <div className={styles.h1_div}>
            <h1>Проверь своё резюме перед отправкой работодателю</h1>
          </div>
          <div className={styles.p_div}>
            <p>Загрузи резюме или вставь ссылку - получи подробный анализ за 10 секунд</p>
          </div>
          <Button
            height="50px"
            width="217px"
            fontSize="24px"
            borderRadius="16px"
            variant="subtle"
            bg="#FBC02D"
            _hover={{ bg: '#ffd468' }}>
            Проверить
          </Button>
        </div>

        <img src={teacherpic} alt="teacher" className={styles.teacher_img} />
      </div>

      <div className={styles.bot_cont}>
        <h2>Как это работает</h2>
        <div className={styles.howitworks_cont}>
          <div className={styles.icon_block}>
            <div className={styles.icon_wrapper}>
              <img src={folderpic} alt="folder" />
            </div>
            <p className={styles.p_upload}>Загрузите резюме</p>
          </div>

          <div className={styles.icon_block}>
            <div className={styles.icon_wrapper}>
              <img src={servicepic} alt="service" />
            </div>
            <p className={styles.p_weanalyze}>Мы проанализируем данное резюме</p>
          </div>

          <div className={styles.icon_block}>
            <div className={styles.icon_wrapper}>
              <img src={dashboardpic} alt="dashboard" />
            </div>
            <p className={styles.p_getrecommends}>Получите персональные рекомендации</p>
          </div>
        </div>
        <h2>Что мы проверяем</h2>
        <div className={styles.whatwecheck_cont}>
          <p>структура и обязательные блоки</p>
          <p>полнота и корректность данных</p>
          <p>конкурентоспособность</p>
          <p>релевантность под вакансию</p>
          <p>анализ сопроводительного письма</p>
        </div>
      </div>
    </>
  );
};
export default HomePage;
