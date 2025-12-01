import Header from '../components/Header';
import styles from './HomePage.module.scss';
import { Progress, Button } from '@chakra-ui/react';
import teacherpic from '../assets/teacher.png';
import folderpic from '../assets/folder.png';
import servicepic from '../assets/service.png';
import dashboardpic from '../assets/dashboard.png';

const HomePage = () => {
  return (
    <div className="global_container">
      <Header />
      <Progress.Root maxW="1041px" size="sm" colorPalette="yellow">
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
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
        <div className={styles.whatwecheck_cont}>
          <h2>Что мы проверяем</h2>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
