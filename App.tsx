import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Swords, 
  Users, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  X,
  Target,
  ShieldAlert,
  Info,
  Check,
  Zap,
  Move,
  Save,
  Search,
  Skull,
  ChevronDown,

  Activity,
  UserCheck,
  Clock,
  Sparkles,
  Image as ImageIcon,
  Flame,
  Heart,
  ChevronLeft,
  ChevronRight,
  Database,
  XCircle,
  Shield,
  MousePointer2,
  Download,
  Upload,
  FileJson,
  Dices,
  Coins,
  Triangle,
  Square,
  Octagon,
  Hexagon,
  Circle,
  Box,
  LayoutGrid,
  Hourglass,
  BarChart3,
  Play,
  Pause,
  RefreshCw,
  Minus,
  Compass,
  UserPlus,
  ScrollText,
  Filter,
  Briefcase,
  Link as LinkIcon,
  PackageOpen,
  LogOut,
  Sun,
  CloudRain,
  CloudLightning,
  Cloud,
  Snowflake,
  Moon,
  MapPin,
  Tent,
  Grid3X3,
  Maximize2,
  Lock,
  Unlock,
  Crosshair,
  Tag,
  Hash,
  Star,
  BookOpen,
  Package2,
  Trophy,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Hammer,
  ChefHat,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Shuffle,
  Layers3,
  Zap as ZapIcon
} from 'lucide-react';
import { Card, CardLevel, CardBonus, Character, Combatant, CombatState, CardType, CommandType, CombatHistoryItem, Condition, FieldCondition, CustomPin, CombatantUnion, Item, JourneyState, ActiveForma, ConditionEffect, ConditionEffectType, ConditionEffectMap, Seal, SealExecutionMode, DamageType, PRESET_CONDITIONS, Recipe, RecipeType, RecipeIngredient, CharacterStack, UpgradeOffer, UpgradeOfferType, UpgradeLuck, UpgradeShopState } from './types';
import { DatabaseService } from './utils/database';
import { rollDice } from './utils/dice';
import DiceAnimation from './components/DiceAnimation';
import CardRevealAnimation, { CardAnimPayload } from './components/CardRevealAnimation';
import FusionOverlay from './components/FusionOverlay';

// Command icons (base64)
const ATTACK_ICON_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAA4CAYAAACCNsqxAAAAAXNSR0IB2cksfwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAASWklEQVR42s1ZaXQUVdq+dWvtJdWd7iTd6XRCMICEsI8w6sgwM4rHheOgMy4ojiIiDAzLhAEVwRk0wKgoIoKILLJ97A4KApFlZN8JECAJgZA96X2t7lrv/S7O9+P7zuHPp4n6nPOeqq6qc/q57/u8z723CvxYuFRZCS9euMicPnmKvVxZyVVXVTEzZ86E4HsCgh8BWw8dMp07d85NiN9ZV1d31/Xa2rvq6+uLH330Ufe69eu4nyXxP7zzDlNx4EDWmTNnSqqrqx5taWkZ29zcMq6m5tqIioqKgRRD5Wz/Yjt39epVCvycsHrtWvOYsWMHvjh69JTS0mk7Plq0qPHDhQvbp5WWHh4zZsy7EyZMeGLJkiXFZ8+etbW2tkLwc8CwYcPoDxctyhn/5z8/NHHSpEVz582rWLduXeqzFZ8Z06f/LTBixIhTjz/xxKrx48dPmDdv3uBdu3Y55s+fT4OfGlu2bBEWLFjQvXTatBfffPPNL1asXNm6dds2feWqlZiQRU899VRs5MiR1S+++OLWiRMnls6ePfu3a9asKbh8+bIAfiocOHCA2r9/v50QvmfGjBkzP1j4wanNmzfLpBnxP+b8Az/9zNOYkEZkANKkyZPrpkydWj5t2rR/zpkz53FSlW4nTpzgL9TU/Pi6nzJlMr1o0Yf5M2ZMf3z27FlLVq1eVfvFF18YixcvxmNfGYuffPJJPGrUKDxj+gz81ltvaUQqAZLx4yQ+nDt37rNE932/OXpUPFVRcVvynaanl14aLZBmyyenvW02Wx+nw1lEM7S1oaGBamltAbfACzzgOR4IJgFazBaB5zkrLwiZFEVlpFMpKuTzaVZBSJaWluqkOuB/g6qqqgKdAHj8+DFnzbVr/XmefyA3N/fX2dnZxalUynbi+HEQCAQJWROwWCzA+l1Ygd1uu/UbcxwX1w2jMZlMXiXPn2Vo+mxBly615Hpi3759aQCABggY0DnggsGQDWDsMplMBWaz2YWQIUQiERCNxv7zAMcCgWScYRgAIQVkRSFHiMgtZLPbHFlZzgHhcNiRTCScZLLKkWW59t5772222+0RAIDONLc2gw4GRQHKJEmSEwPgMVvMHpNJcCKEuEDADzRN+46swAvAJJgQyTIiVaEgASFvkHsGpCDOyMgwEeQH/QEaBYMWKZFgmhoatIL8fFkUxWSHG/7K1Suo6utXLVIq6aIIcRNvyqYhY5GSRLPBMCD6BaTsgGNZREIlpKVMuz1BMpkilVETySSOxmISQTN5LuzN9zoKC7v08Hq9RWSQ7mg0YjJbLFSHN2d7SxujyZpHVdVi8kd9XS5Xd5qmRTLVU83N/6kuaVZAsokZQhwCkBAEIWiz21vJIMJEElo6nU4CgJpNAh8xm0wKuR4j4201kNGa7cr257hyUtRXX33ZoTJpamoSSfQBAN/vdGYN9eR6+imqlnnu/Dmqvb0dWMxmkOV0fteckKJSRB4+kvnawsLCGpEMiGS6MJ6ICxQALXabrS0rKytO3CYYiUbaYol4o93jaOR4Lt6hzdm3Xz9WIs4RDAbdFAW9omhzkctCIhGnSKMBjBHRtXBLLt/pHGNMQQAo0oCK3+8PsSybIvKgrFYrH4vGfMFQuA7S8KbD6QwgGkiOXKf0i753yQAA3GHEXbnuW/7MK5riJF7sYRmuC88LblXThFAoBBRZvkX2uyDS+R83gTQhaiLhxAjlEgv0kUoEiMySxApbdF1vyM/3NhV1K4qETCGje0YPZLPYjA61Q14wAROEAsvyDvLnbo7lXYSYLR5PQmKDmBDFLMNAhmW+a06iW0C0zdIQWjSLxUV0nbrVmETjdQjjRgDATXd+fkvPXiUhmy1TJ78x6AyUzpgB/33smHfD5s1PLvlk2aeffvpZ3aefLkdlZXPx2DFjU6OeGxX569Sp8TfemKnPmzcXLV78EVq27BNMpnZ94cIPImVlZdVkuv8XidfnlpU9uHr16vzjp04xnb6R+N3QoUwiFnVQGLtZlnFhjCyk0UDA71ejsaif6LeG+PlFkumr5H4TEXoQQigxNE1xLCcS93BBinJrquoAGAn5Xq9RkJeHwG3QYVIhbkFfuXLFHgqH3BihQuISebKBzMQdMJFJnDjCTQDweYb1BohFZpDmdN3StKbpXvJsPmlG0Wq1sBzHisTDXQxLZyeSCaG9vY3qVOJt7e08cROHpmpejHEXQtJDJGsKBAKKn0x9pDlvkJnwrDPbWefKcZvgLeIAeAEG3RBCdxLt55DBQFKJGAAYKpoqKKrCkSYFnYYzN65TlVcvZ+7avfNXGzf91+wNGzacXrVqlTpr1iz09NNP+wcNGnSgpKTkDbJNG1T+Tbl48tRJO1lrFxw4eHBAeXn5iPK9e6fvLy9f+O3Bg8u+Kd/7ydo1n7+zZMnHL/xrx7+6HT9xnO40jW8xsVQyHRUYiLM4FuZCiJ2aptB+nw/72tujJJqI/TX06tWrnSxdJVEUY+aMjJaLzc1VHM+fJdP9EYfDccCZnXUwKyfneLYr57I7191KNJ7e/fXXP8xJQlojldZaoaE3QKReh1qyEiLlEtTj+yhfex1zubKi6OC3B1/evXvHtu1bN7R/uPA99NzIkakB/fodz8nOnvPAsGG/3blzp/P06dP/R7OkOlxzU5P9Wk2N2+fzeZuaG4sOH/l38c6dX3Ylu6cMsvGgwPfBqFfGwLWH9/BhtdaelM94dPlQgZHY20Xzb/KiyAaX7t/o8FftdZ0/eXZo+YFTb+/cc+DY5+vWxGa+8Zrx6CMPtRZ17brV4/GMfvnll3teuHDBDG6D2mvXqNmzZkHS4LBsbhkzdepk/tVXXxVqampo8H3R2FgpKEp1PlKODUaJHY+h8OrnUMuiP+Hat59EVTMf1i7O+k3bocUPHtpVPnHdpjOb1mw7e2PugpXqS+MmSXffe995r7fggz59+tw/adIkB3mv8r1k+f92FVVphEhvymR0qTuQg71wquXWMQsnIzSUIjLQ0jGgc5IajVKhIOs536h1awimHUhNgFB7OuwLazcFi3hj8OCB7T5fawIAgMCPAV2r5XVpzwAjtPavyvX5W9NHR15OfjmwPbnxDr+2uaAZf9XzuvbVry7VrH7m3PK/z73ywPDP/Hf+epNcOOj9RGbXF89mZA15Z8jQ4Y9sXr/aM+7lFyD4MbAJRVlZrcgz4lv+oNe/vzqwb1RN7eKi+JU5dLL5XehLLKdbtI22UHrrnfGa5fcnlk97KT3ioX8YfX+5VC8ofidgto0pz/OOnDJ5ctkvLp0/Kl65dIQCnY16o52K6jftirz3Hi20YqZSMeX49eWDg0dLxebD4+CJS9OpTcGP4frE58z+2FrrNf/qoviX0+5Ef3/mYfzCwxP0IX3GtZV4R+18/Hd/+/P6JWv7Vx/50go6Frf38RoqCq2gyc6gaBGlJXrFG68XRBobmFi73Bjz45OaZvkGWm1fs3bLfkE0n7dYUVuvAkV7pHcA/L5HNXyse63w1MCE/Zn7OPfdRTgrP9+SEQtd73ypKNoZAStbB+P40rf12tdPX1vUM3VkAt+64/fU+h2Pml6ofLNP3/i3g7rE9ve5u3HbgL9WrSguv/heXqB1Ub7ROt+Fa2d5jaq3BjcEN47dphx9Z4pRt21A1bUjln9fOt15cllx4zAXT+/pakgrn0OBt7ck9o1oPv+6M3n4Reb8ruHUnD3DnffWLpskvl81j9u4aUbBwjcfG/X2K723LR3raj78mlWpmwVRcA6D5E/yk6kNQ6uVvWPW6hcXPK+0H+l5puq8GXQGdn/zER2Xv/GoqY0PG9GP3kV1ky/cWFIUOzmRrd//FLVpzyP084cfcxVe376UmXnuqjC+bGn/h/74/OQhQ+7Z+/zwga3/fL4gumUMDLe/yweVpdZYdJknEVk/pDJ5YOISpWbtH5XIZe/7qfYOkwwNCI6r9cyQLhYHZ/h7QC0yGEihu43aS8XNFy6QU72aUunTVt56npPAzeTvxmqUzmQ11tb3qm/wDYxLVAmmM8RwNB6gKa3e7aAaREGWdTWemVaUTFljaExxEiPwPlFLhYZO+oveIc0pJc9Q/ZRWEWpSN6gpA6AaH2C01fW4ea5CTAaMpBTDNyAtVud0LW7OfCg7vXHPXkrzt9msjFFoYkH3jAyrR0GsEdQzr4Vpz6Ekl7kHmdhDvJkYlOJjtFhTVyrR3AsmmrsVmzJyaGDlOoS4wFghT+l2oColWFZJtsN9QjWXPaEGP1QlQ9Y1kGAt9oQpv7t8usEDHuufx+gxv9PM4YJMUfCKZsYCKZzAjOW6as47w3kKj/Fe+wnOYzlvd7AtQPWbaTXYjVIjJYwR7/aA02JbWFZG/WDiWMcUkGUbkNXuKBYrQW2tXiMc5IAKKFUGtCYDUU/JDi3QIPY2p8yJ5gZnKtDsAWraw0Bg43lGNZDhoyDTwFpddfYe/et4D38VWphTtAAumzhNZqh0HgRab0pJ9DCjpO0MkuEPJm4gCmAEMUC0RgFWBpgneszUKY4GvABEhgbddTnWP9ZyvS+j4RKTHO1FSeHumix7IQ3NiqJGNVVrMvPm5hy3xyeIOTFoTgQAAxpphm7hOUqmIRI1RffqKclD62lLrOqHf6hiVrI29ApKh8n5JQhyBGzcETfnRYsK1YQ72VRvj/BGb0NO88mYZgEa04RznCyEQnFKhvnptMImUumArOMGa2ZWW67XEXPTGxFKGQBrGAGEDEAZSDM0qKcVnlM0jiNXnu7V+4dr/Ak6AwMhP2xw2ZVIyD4MbN5vzV1LzmX37tOSW9wVZbug3WpFvRRVvScUDQ8NBoP3xuKJ4qSUtCuGJsVT6XrICjc9XXoEjp3zGap0HaoxZEUyytQ1ZDMAzWEMFcPQYghRcQNBvQrQHbKsxRQrpiBkGilkSVC84aeYdIISNN7MYItHl3OlhlaLrKAecQXkx3WMFQx4CmBIITVA6enGXHdmy6CBJYnjPYfi0OnlrNeNnUA18g0VeTSdMQk0F+dZ5ibLCQ2Qs8V7sxbUIT5OgElodqdTUmgmTtMquUOLFA1tjJG04lTUlE5oXAoBU4wWzWGV4XUdIyOdaAMJf3U/T0btsIE924alLil040GrhdG70QjdpauwBLCuTMbibuPseScZZ8+KIPS0pDSYAh2NvUYrrWqVhYa0eyT2fbIMnxpdqWzom/aVmfGpv0C8drQbz3u2Dy4dMUAd/es7Kv/UN3Pxkj/0euLqe0/l108vMQXeFQviy5hnlTVwk7TGdtO/pp8/vffZ/cbF+eNk35GeFVLI1Ck7oIHQgWjKFAKsXo1oSQS2OxxUdthiSsfycnAbl/LFAGuoIBMAJobjDgSNoiwJB1J1qixkCj41bbJTjFLIcshDmU1WjCxpgxMDiBf9kkGH8zBSQGchikOUX78m6vH9v9SbPnvNuFC6V99znz+1Mgv53+ZwXSmLz74E8bfPgPTXw0Hj7uH0vn1PCAuOPW+bVj1VfMM3X1gvrxFuJDcVJIPbH6yWjr26RK9f/5u20DlTB65Vbo+63zyoDQZQp1CKpRgk0izORmnJwaQl2kapIMsKgMMOGd6MMygGW3VdF5GuuThW62KygjsE0ZTHWbMBZfE2MZlFlbS966UjrZH2H2Xvqaohi5460x+Ft4xHje9vTx187mb4s76p+AKnLn9gQdpSKwkTjr7P69XTQOzCeOCvmgT8LXPouLE2T8W772k1jo75yiBrYSN44s5UpJru9F3+LSy/UKOMG9ClHaHUVcArAu0oCvMprUBhuBxNi2UKFiSazLTFJCXZLBAVY20pzOJbI8aUlNQMk8hING2OYdqS0AyOGJbQCVu320MHQIykNOtVIGTtgWLOeujpvpYvHrLD0u+hY2zR/TWG+65WPbs4zrkL9AyXCZiskGJZCJISMGSZVQxsljCVkaYFp4EZEXdOxm8PJZ5U1GOVVyNdftm1IS+jay2np24yUG+kkNQVoEguL/ncQMzyCGZbTrKtzSmnDT6mCSrWBAkbfISnLHEKCtrST5aDnwyH1VYmpjRl6nJFoRbf1V+Lfj7U8C16FtWXvWVc/tsXqQMjqxo3DvPXrh9e17Z7wo7EhY//ovnP/MJQYragv40CPyViepgy9CY6naxgTl75SEhKe/K06PbfGoHVE7T69xYlLr6+Llbx9+XJqo9fU9v3DENySz5GKg9+blCNdlZXr2UZ8v7uemTNoFTDovvkphV3K8EdvY30JQ9GKRPGRge/O+wYaACaQwCwYUBBQIKiICQHGgOaxZ3xxey/AVT0h7KwBff6AAAAAElFTkSuQmCC";
const VINCULO_ICON_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAZCAYAAAArK+5dAAAECElEQVRIS62VbUxTVxjH7xX6Aty2Ujqg5Zq+0AqjIK4U27HaWIWGtxgSDSRG98EEogmiJoRowmbCmsUwsixAjN+WmCYmbh8ImkrU0C8LC2Z0kRfTimlptC/WUrUipYzbq89NTtN0VEE8X869557+f8/5P895imNfaNyy24sJX2wV5FZKcnJhbjeZgviX0Adx0HnjemqIb8Q1nGyOQ1Cm/GvHABB+Njs3DuKvwy9zOf/q1PBM1c7c/tpo7NoRAInH7itqvX7i3XJ8kbEFhrzRGdS1tmp2BBgdHf359YTsMhL3vVnAIqtPGctrG0m6rbNDAs+flQOIfm5y8gFY4vAEaBBny2fwcDhML3uzEwZ5z66mc1g75GHbABAPLSz0pEcv3LeYkCoMlvvWyRMiQq08dUl5tVCtHt4WAMShUvyhoDXr4TccsGc2NMZ4X3LgGaZUlpJzDu+liFPcbejIYvKwbQBUTWpiwZ4SgRrjaf92FhWJ6gFmt9vv7VntqgCbtgxItQZEUpOLAB0Nx/XNJ5ujTfUdwzn8je4mc+PWAMiaF3fEfyBxmKE0mRN8sKdQoh2oqRTNQ2JvjoxM8Hm72VVVFcZPnmBoaEgkIASHMGHu8IsbAjFEjuodAUqNaxhfKB2AdUnhf0+cTr8V3pUy1mgSYLPa+Oltw7HkKKcoqi0Wi12+yOPT4yppEEGS0X/wn1s9g7FY687SUpnFH2LtjUa8P1ZUkHoul+vGQdi34jNDD0lGtrxcCc/RaFTLYrHEJEnSxe6f8KDiB5ppCxMyHNU/+A+DLrs7u7+62uZ2e9tyeKpbR/XVv0I+cIvFcsAbenlN6m6oST1BqhUF5ok8gExNzWP6rHHslersut/3nP32LY7xeDQGcyDgmi1Tm8fIYsoGkff29oaZmwweT09P11GPzWPpFhVwVEz7hSGVrORB1FL5OVyeL6Q9ryL4d3sF2MGC87SVIP5ZXHxnO3xMfx36T6oOk4O+vj4JXJCcQH03vCNhEP1fXti/07G1tcSSx73rIJeDm00BTBRq+MUmkfw2ODjoT9+fTHJLS4siEScukJGzpzcTRj9Mb248mR8rEqpGqjTSqx8FgABA9sgN35NLVVfSI8kEgPXKQ+xHNRpNV39//8OMJ0AfwK7oan7XZhCUeNT74ZLBgEoqNIWZukfJRXqbXjSAwAYAUVPf9iLLMgFgL1y28nLJSa1CewfK86OA1NN4PB7tBkUNiJZ6lGg9/QTwRyPMVdIAMRlr2jvPdP65JQDaBLmhPA11iTh2geDmJS8kfEc2IQi0abFYvC95DzIlc7N1BIJvAIMZgAiC8lFwZN6Rz+Uchar6ZLPLBHK5XOvwbTfJMcD8VXZlHdpL5Cce6HS6KTjFe01dI6Sj+VCUAAAAAElFTkSuQmCC";
const ITEMS_ICON_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAaCAYAAABVX2cEAAAELUlEQVQ4T4WUb0wbZRzH70qhXYVS2qMeDMtmsSO21g266ZYiEglKl/GK4eImkiXNiE5GMlzwhb5oTFSCBtAXCu4FZJkOTSQzdhshY0iZYNuBDTCKpdtYgYMVQq9y0lqK/V3y3K6F4b3p9Xme3+e+39+fB8f+57Feskp71noimqBGMp02zbSfaWeeFILvxOr4pqNyMDx4tp+ySY7SZmtIMxU5kmKcgpj0fXm2qpISih//RBgo8q56G0XKjBrL2Ee+fzwMZTKWSY9p38mTGY10xl33D6PDI5N23G5FandUZrFY3srKVzdn5eZ7Lt6okTjW16IlpJGpeumcQLRfR4CqiMPR9/N4ZyMAd4SBuh9XrtSZtNW1ewnCN+oeVw1SN6aRtSLydQ18qHukNaqhNRd2hEFQc3MzgSenWKVZihwEoReWfX/iDq4QwdXRVJmsoGdbWJi69/JNr1/juTOS74zaGd1mYQWAEACCERisl5JFV5NFoi+3wADU+2ClyT08JIYAUHRgn24W3gduDQhaFlswKMauPAmJINA2DQ0N/i2wa0NDbb65+5UyBRndlSrzIgWkWJhyz+/P+WWi02O19dKwfnpPdW1TU9M8OhMHu/b76B7fw8nbkGSo2NFDBet94XBOxtQUjZIPFsEaApTnlr66bWsAbPKPwW7IDVQK7BXq9awKp8slBZuwB00Ma9AmSRjed1z+ZpvplInmlAEI34y8ctnx1Wk4CDCwihSsLlMCUIyUQd6KdJnZxnRz1C0eZ9XFwf5mVmyQkxc3DRJIPMAQBKkBCNdnMdhr8jO9rmTXJ1tgfItI1ez4xDyyxgex6mMwk7LuM3Ot+Sf4/1hZrIrfO7/V8y2CKmhQW6BDAElPhMGsnpCfqIB8cTB+Fe8U+oqJ3VyzY6qr2MAstlg8Q/1l58Ogz+qfrsfOn6s7FNca12/bq3/1rbZ1Ex+kZorkSWjzUWhlgxsh73JU+qxCQMd+CW/ymEH8lIBv8bGymMXPnZb37+oWNwC2JDwbVEa+TuPD4DCAAAhnSuY+DJSH/1UhiyxsZmZGddM5PFxHNxKSbMt6kiIdicHwNQvbTwBBi6BKTT53sFJw7FOlVtvGvyBxmMXzv3mudz245Rdq85QItrEcwLC5gJDBvxACgPtC7KWYPGw4ZaiveePIwS7+Oge7HJhISdKrImgTYMz8x+ywJ8Ig8c/oX6jYcm2DMtci3dLpXsq/khsUQDCAhOJWCbLHh4HFk2T1grnqZDZfFVcABIRhbt19MWsh8HYwMuFZCmd0qRJVHS9Ie74s+7t3Ey3GNS0LpIJlj9aCBFxBA5SV9GF+HPoLKQBV72kvzKVK5Mbywwfub6uMv4gG/qFrjAlFQgWhjWgp7KNZ3avIbDfs11sSQXHKttvs7u8nYT1NLGMLoVFK2RZRq9XszZv4/AdmXEo4FZQZ5gAAAABJRU5ErkJggg==";
const FOCO_ICON_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAEEUlEQVRIS42WbUxTVxjHe8ttKaAWWm0qNhBfUNkII3vRidVEM4SQiAwz9+IMM+qWsWG2xWijiS8xGiWabG7zw6ZZljhUPjDRaYprENAZJ2HpOrJaNBgdb7MUZAXbHkq7/k94mkOpwP1y7z333P/vPP/nOc+9kmKax+1wWCdOzZek/um8Kk02iUT9CsU7mDfK2Kc4J6jV3+CsUSgu4DwZ7LkAiEOYRFmrw2TtfBqCYMmG1d0EmgoSFxArHrC39VVbe422ooDRUG1Ur1k57J8uZAIgVhwrvVzXnH7jtxSN/nB/Ytstt7f/UG/79s1my9ZK8x9kHyKJZ1VcwDBjtyg3tHp9ttrgKApo73UnK56U/96q8bSV+h781Ckmf0rAVKsH1Olk3lHPoEKMghYzJWB3XTi9oIjZVE5Xttvj7mr2hGbAGniO1RMAZ+QiVzfw+E2zJjlpRmqHPBo6E5bk5hs/n2dVVVW8CHBwi5IWbTbxG+NwcWnBjl2O/rQMmtBT6GI55jkz6R45SNBzlmLU8Vie27ZMiWvA8J7p17vbm1hLI8ZgYRSgfM1n1WxZn4GXs7PVUUESFgG4lhdkTpgTHnzqBXS4PvdLyX729DiAX59zyfDj8lfw8tL0Z7G60XuKQNKmcgDNRfI5IJKfwhZDb0rarIrvd66ySUjs4B37rK+2NZnrZ/o+m3NqyWJuV0QgFuTyzhsYudakkVflJuEZ7kOdD2WI8qNrkFt2/G0VS1rxqmWtJJ3mANRyX2NjbfmOMzIiIUg8ECKAPcGOR14IcuF52iCJHyjx9aWazf+hnWBvcADqHgPWPXsufV3bpRx5odyu2zekFn1SmuYHw96BNLKBniFnlGwSp2cparVZagiHK9BvAAjcsV8r23IiiGpSFSz8MO/zNTwn0QRffODDalUv5XEYxgFEycaK49k4AAYAIasQxcpzTD9OfMwOrFqMyL3T1X7l1LpniXk5s8UFcQBZFA05AqmpPGY4nzn0ft5HKxZiHL5zv+H12AEIVRJaxyeVlpoNb7EPRJ1xORDJPxyzyeic2A+8NURqm8SjmyxSORTJv2XWjoPF7Hq+xVIaFyD2fTQ3S3VgmftjfyIm82rBMVaCuOzJuRtKyM3g0SAK/8Wrre+6Z/+y8eQXmwgAe9Cb+E4Wm5wIoFJEbaMVaLOKO2TZ9rrHyZ7UtKp02vV/J2NPBG86fIXdWZ1bLW9wKJVoFCBClH/+9e13df/cr0+/bxKFyzayaH9Kc7ouHD9y2H61Z8TIdBVHAXpP+yLDR0gU5xGK3lMknoaGveikq/XKIWwacQ4JYPfXtgwtMg00rO3N2v9ySebtdm1+/kHMFdt23A8OCdLXCvf07RUFYv80YsUnRCCulGyjsXgfEwJM9lfxP3fGeTvZcIHLAAAAAElFTkSuQmCC";

// --- Portal de Confirmação (escapa stacking context de backdrop-filter/overflow) ---
const ConfirmPortal: React.FC<{
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
  confirmLabel?: string;
  confirmClass?: string;
}> = ({ message, onConfirm, onCancel, icon, confirmLabel = 'Confirmar', confirmClass = 'bg-rose-700 hover:bg-rose-600' }) => {
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 anim-fade"
      style={{ zIndex: 99999, background: 'rgba(8,10,16,0.85)', backdropFilter: 'blur(12px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="rounded-[2rem] p-8 max-w-sm w-full shadow-[0_25px_80px_rgba(0,0,0,0.7)] text-center anim-scale-in" style={{ background:'var(--bg-surface)', border:'1px solid var(--border-gold)' }}>
        <div className="flex justify-center mb-5">
          <div className="p-4 rounded-2xl" style={{ background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.3)' }}>
            {icon || <Trash2 className="w-7 h-7 text-rose-400" />}
          </div>
        </div>
        <p className="text-white font-bold text-base mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all"
            style={{ background:'var(--bg-raised)', color:'var(--text-secondary)', border:'1px solid var(--border-mid)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 rounded-2xl text-white font-bold uppercase text-xs tracking-widest shadow-lg ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- Componentes de Utilidade ---

const ImageUploader: React.FC<{ 
  value: string; 
  onChange: (val: string) => void; 
  label: string; 
  compact?: boolean;
 }> = ({ value, onChange, label, compact }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit (IndexedDB suporta bem mais)
        alert("⚠️ Arquivo muito grande!\nPor favor use imagens menores que 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (compact) {
    return (
        <div>
            <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-900/80 backdrop-blur hover:bg-white text-white hover:text-black rounded-xl border border-white/20 transition-all shadow-lg"
                title="Alterar Imagem de Fundo"
            >
                <ImageIcon className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-[11px] font-extrabold uppercase text-slate-500 tracking-[0.3em]">{label}</label>
      <div className="flex gap-3">
        <input 
          type="text" 
          placeholder="URL da Imagem..." 
          className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:ring-4 ring-amber-600/10 outline-none text-white transition-all shadow-inner"
          value={value.startsWith('data:') ? '' : value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-6 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition-all flex items-center gap-2 text-xs font-extrabold uppercase text-slate-300"
        >
          <ImageIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Upload</span>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      </div>
      {value && (
        <div className="mt-4 relative inline-block">
          <img src={value} className="w-24 h-24 object-cover rounded-[1.5rem] border-2 border-amber-600/30 shadow-2xl" alt="Preview" />
          <button type="button" onClick={() => onChange('')} className="absolute -top-3 -right-3 bg-rose-600 text-white rounded-full p-2 shadow-xl border-2 border-slate-950">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

const StatBar: React.FC<{ label: string, current: number, max: number, color: string, icon?: React.ReactNode, onEdit?: () => void }> = ({ label, current, max, color, icon, onEdit }) => {
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  const isDanger = pct <= 30;
  return (
    <div className="space-y-1.5 cursor-pointer group" onClick={onEdit}>
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider" style={{ color:'var(--text-muted)' }}>
        <span className="flex items-center gap-2 group-hover:text-slate-300 transition-colors">{icon}{label}</span>
        <span className={`font-mono font-bold px-3 py-0.5 rounded-full border transition-all ${isDanger ? 'text-rose-400 bg-rose-950/40 border-rose-700/50 animate-danger' : 'text-white bg-slate-800/80 border-slate-700/60 group-hover:border-amber-500/50'}`}>{current} / {max}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden border transition-colors group-hover:border-slate-600" style={{ background:'rgba(0,0,0,0.4)', borderColor:'var(--border-faint)' }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out animate-bar-fill ${color} ${isDanger ? 'animate-danger' : ''}`}
          style={{ width: `${pct}%`, boxShadow: `0 0 6px currentColor` }}
        />
      </div>
    </div>
  );
};

// --- Helper de Cores ---
const getCardColors = (type: CardType) => {
  switch (type) {
    case 'ataque': 
      return { 
        border: 'border-red-600', 
        bg: 'bg-red-950/30', 
        text: 'text-red-100', 
        iconBg: 'bg-red-600', 
        hoverBorder: 'hover:border-red-400',
        badge: 'bg-red-700',
        glow: 'shadow-red-900/40'
      };
    case 'reação': 
      return { 
        border: 'border-blue-500', 
        bg: 'bg-blue-950/30', 
        text: 'text-blue-100', 
        iconBg: 'bg-blue-600', 
        hoverBorder: 'hover:border-blue-400',
        badge: 'bg-blue-600',
        glow: 'shadow-blue-900/40'
      };
    case 'vínculo': 
      return { 
        border: 'border-slate-500', 
        bg: 'bg-slate-900/40', 
        text: 'text-slate-300', 
        iconBg: 'bg-slate-600', 
        hoverBorder: 'hover:border-slate-400',
        badge: 'bg-slate-600',
        glow: 'shadow-slate-900/40'
      };
    case 'ação': 
      return { 
        border: 'border-yellow-500', 
        bg: 'bg-yellow-950/30', 
        text: 'text-yellow-100', 
        iconBg: 'bg-yellow-600', 
        hoverBorder: 'hover:border-yellow-400',
        badge: 'bg-yellow-600',
        glow: 'shadow-yellow-900/40'
      };
    case 'reforço': 
      return { 
        border: 'border-green-500', 
        bg: 'bg-green-950/30', 
        text: 'text-green-100', 
        iconBg: 'bg-green-600', 
        hoverBorder: 'hover:border-green-400',
        badge: 'bg-green-600',
        glow: 'shadow-green-900/40'
      };
    case 'combinação':
      return {
        border: 'border-purple-500',
        bg: 'bg-purple-950/30',
        text: 'text-purple-100',
        iconBg: 'bg-purple-600',
        hoverBorder: 'hover:border-purple-400',
        badge: 'bg-purple-600',
        glow: 'shadow-purple-900/40'
      };
    case 'forma':
      return {
        border: 'border-amber-400',
        bg: 'bg-amber-950/30',
        text: 'text-amber-100',
        iconBg: 'bg-amber-500',
        hoverBorder: 'hover:border-amber-300',
        badge: 'bg-amber-500',
        glow: 'shadow-amber-900/40'
      };
    default: 
      return { 
        border: 'border-slate-800', 
        bg: 'bg-slate-900', 
        text: 'text-white', 
        iconBg: 'bg-slate-700', 
        hoverBorder: 'hover:border-white',
        badge: 'bg-slate-700',
        glow: 'shadow-slate-900'
      };
  }
};

// --- Componentes Adicionais ---

const TabButton: React.FC<{ icon: React.ReactNode; active: boolean; onClick: () => void; children: React.ReactNode }> = ({ icon, active, onClick, children }) => (
  <button
    onClick={onClick}
    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden"
    style={{
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      ...(active ? {
        background: 'linear-gradient(135deg, #c9983a, #f0c060)',
        color: '#0f1117',
        boxShadow: '0 0 20px rgba(201,152,58,0.45), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
        border: '1px solid rgba(240,192,96,0.5)',
      } : {
        background: 'rgba(255,255,255,0.04)',
        color: '#7a8aaa',
        border: '1px solid rgba(255,255,255,0.06)',
      }),
    }}
  >
    <span style={{ transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s', display: 'flex' }}>{icon}</span>
    <span className={active ? 'inline' : 'hidden md:inline'}>{children}</span>
  </button>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 anim-fade" style={{ background: 'rgba(8,10,14,0.88)', backdropFilter: 'blur(20px)' }}>
    <div className="border rounded-[2rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scroll shadow-[0_30px_100px_rgba(0,0,0,0.8)] anim-scale-in" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-gold)', backgroundImage: 'radial-gradient(ellipse at 60% 0%, rgba(201,152,58,0.05) 0%, transparent 65%)' }}>
      <div className="flex justify-between items-center p-7 pb-5 border-b sticky top-0 rounded-t-[2rem] z-10" style={{ background: 'rgba(22,27,38,0.97)', borderColor: 'var(--border-gold)', backdropFilter: 'blur(8px)' }}>
        <h3 style={{ fontFamily:"'Cinzel', serif", fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h3>
        <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-rose-600/20 hover:text-rose-400 transition-all" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-faint)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-7 pt-5">
        {children}
      </div>
    </div>
  </div>
);

const ConditionManager: React.FC<{ 
  conditions: Condition[]; 
  onSave: (newConditions: Condition[]) => void;
}> = ({ conditions, onSave }) => {
  const [localConditions, setLocalConditions] = useState<Condition[]>(conditions);
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(3);

  const handleAdd = () => {
    if (!newName) return;
    const updated = [...localConditions, { name: newName, duration: newDuration }];
    setLocalConditions(updated);
    setNewName('');
    setNewDuration(3);
    onSave(updated);
  };

  const handleUpdate = (index: number, field: keyof Condition, value: any) => {
    const updated = [...localConditions];
    updated[index] = { ...updated[index], [field]: value };
    setLocalConditions(updated);
    onSave(updated);
  };

  const handleRemove = (index: number) => {
    const updated = localConditions.filter((_, i) => i !== index);
    setLocalConditions(updated);
    onSave(updated);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {localConditions.map((cond, i) => (
          <div key={i} className="flex items-center gap-4 bg-slate-900 p-3 rounded-2xl border border-slate-800">
             <div className="flex-1">
                <span className="text-sm font-black text-rose-400 uppercase">{cond.name}</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-black">Rodadas:</span>
                <input 
                  type="number" 
                  value={cond.duration} 
                  onChange={(e) => handleUpdate(i, 'duration', Number(e.target.value))}
                  className="w-16 bg-slate-900/80 border border-slate-800 rounded-xl px-2 py-1 text-center font-bold text-white text-sm focus:border-amber-600 outline-none"
                />
             </div>
             <button onClick={() => handleRemove(i)} className="p-2 bg-slate-900/80 text-slate-500 hover:text-rose-500 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4" />
             </button>
          </div>
        ))}
        {localConditions.length === 0 && <p className="text-slate-500 text-center text-xs py-4">Sem condições ativas.</p>}
      </div>

      <div className="pt-4 border-t border-slate-800 space-y-4">
         <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest">Adicionar Nova Condição</p>
         <div className="mb-2">
           <PresetConditionPicker onSelect={(name, dur) => { setNewName(name); setNewDuration(dur); }} />
         </div>
         <div className="flex gap-4">
             <input 
               type="text" 
               placeholder="Nome (Ex: Envenenado)" 
               value={newName} 
               onChange={(e) => setNewName(e.target.value)}
               className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-amber-600 outline-none"
             />
             <input 
               type="number" 
               placeholder="Dur" 
               value={newDuration} 
               onChange={(e) => setNewDuration(Number(e.target.value))}
               className="w-20 bg-slate-900/80 border border-slate-800 rounded-2xl px-2 py-3 text-center text-white text-sm focus:border-amber-600 outline-none"
             />
             <button 
               onClick={handleAdd}
               className="px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl shadow-lg transition-all"
             >
                <Plus className="w-5 h-5" />
             </button>
         </div>
      </div>
    </div>
  );
};

const CombatantSetupForm: React.FC<{ character: Character; onSubmit: (hp: number, aura: number, init: number, ammo: number) => void }> = ({ character, onSubmit }) => {
  const [hp, setHp] = useState(character.currentHp);
  const [aura, setAura] = useState(character.currentAura);
  const [ammo, setAmmo] = useState(character.currentAmmo ?? character.maxAmmo ?? 0);
  const [init, setInit] = useState(rollDice("1d20", character.baseInitiative).total);
  const hasAmmo = (character.maxAmmo || 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
        <img src={character.icon || undefined} className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-700/60" />
        <div>
          <h4 className="text-xl font-extrabold uppercase text-white italic">{character.name}</h4>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Preparando para batalha</p>
        </div>
      </div>
      
      <div className={`grid gap-6 ${hasAmmo ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 ml-2">❤ Vida Inicial</label>
          <input type="number" value={hp} onChange={e => setHp(Number(e.target.value))} className="bg-slate-900/80 border-slate-800 w-full border rounded-2xl px-4 py-4 text-center font-bold text-white text-xl focus:border-rose-600 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 ml-2">⚡ Aura Inicial</label>
          <input type="number" value={aura} onChange={e => setAura(Number(e.target.value))} className="bg-slate-900/80 border-slate-800 w-full border rounded-2xl px-4 py-4 text-center font-bold text-white text-xl focus:border-amber-600 outline-none" />
        </div>
        {hasAmmo && (
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-500 ml-2">🎯 Munição</label>
            <input type="number" value={ammo} onChange={e => setAmmo(Number(e.target.value))} className="bg-slate-900/80 border-slate-800 w-full border rounded-2xl px-4 py-4 text-center font-bold text-white text-xl focus:border-orange-600 outline-none" />
          </div>
        )}
        <div className="space-y-2">
           <label className="text-[10px] font-extrabold uppercase text-slate-500 ml-2">🎲 Iniciativa</label>
           <div className="flex gap-2">
             <input type="number" value={init} onChange={e => setInit(Number(e.target.value))} className="bg-slate-900/80 border-slate-800 w-full border rounded-2xl px-4 py-4 text-center font-bold text-white text-xl focus:border-amber-600 outline-none" />
             <button onClick={() => setInit(rollDice("1d20", character.baseInitiative).total)} className="px-4 bg-slate-800 hover:bg-amber-600 rounded-2xl text-white transition-colors"><Dices className="w-5 h-5" /></button>
           </div>
        </div>
      </div>

      <button onClick={() => onSubmit(hp, aura, init, ammo)} className="w-full py-5 rounded-2xl font-extrabold uppercase tracking-widest text-white mt-4 border border-amber-400/30 relative overflow-hidden group" style={{ background: 'linear-gradient(135deg, #c9983a, #8a6520)', boxShadow: '0 0 30px rgba(201,152,58,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
        <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative flex items-center justify-center gap-3"><Swords className="w-5 h-5" /> Entrar na Arena</span>
      </button>
    </div>
  );
};

const QuickEditCharacter: React.FC<{ character: Character; onSave: (hp: number, aura: number, ammo?: number) => void }> = ({ character, onSave }) => {
    const [hp, setHp] = useState(character.currentHp);
    const [aura, setAura] = useState(character.currentAura);
    const [ammo, setAmmo] = useState(character.currentAmmo ?? 0);
    const hasAmmo = (character.maxAmmo || 0) > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <img src={character.icon || undefined} className="w-16 h-16 rounded-2xl object-cover" />
                <h4 className="text-xl font-extrabold uppercase italic text-white">{character.name}</h4>
            </div>
            <div className={`grid gap-6 ${hasAmmo ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="space-y-2">
                   <label className="text-[10px] font-extrabold uppercase text-slate-500 ml-2">❤ Vida / {character.maxHp}</label>
                   <input type="number" value={hp} onChange={e => setHp(Number(e.target.value))} className="bg-slate-900/80 border-slate-800 w-full border rounded-2xl px-4 py-4 text-center font-bold text-white text-xl focus:border-rose-600 outline-none" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-extrabold uppercase text-slate-500 ml-2">⚡ Aura / {character.maxAura}</label>
                   <input type="number" value={aura} onChange={e => setAura(Number(e.target.value))} className="bg-slate-900/80 border-slate-800 w-full border rounded-2xl px-4 py-4 text-center font-bold text-white text-xl focus:border-amber-600 outline-none" />
                </div>
                {hasAmmo && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 ml-2">🎯 Munição / {character.maxAmmo}</label>
                    <input type="number" value={ammo} onChange={e => setAmmo(Number(e.target.value))} className="bg-slate-900/80 border-slate-800 w-full border rounded-2xl px-4 py-4 text-center font-bold text-white text-xl focus:border-orange-600 outline-none" />
                  </div>
                )}
            </div>
            <button onClick={() => onSave(hp, aura, hasAmmo ? ammo : undefined)} className="w-full py-4 bg-amber-600 rounded-2xl text-white font-extrabold uppercase">Salvar Alterações</button>
        </div>
    );
};

const CharacterForm: React.FC<{ cards: Card[]; initialData?: Character; onSubmit: (c: Character) => void; onDelete: (id: string) => void }> = ({ cards, initialData, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState<Character>(initialData?.id ? initialData : {
    id: '', name: '', icon: '', maxHp: 10, currentHp: 10, maxAura: 10, currentAura: 10, maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], role: 'npc', code: ''
  });

  const toggleCard = (id: string) => {
    setFormData(prev => ({
      ...prev,
      cardIds: prev.cardIds.includes(id) ? prev.cardIds.filter(cid => cid !== id) : [...prev.cardIds, id]
    }));
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Nome</label>
            <input 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              className="bg-slate-900/80 border-slate-800 w-full border rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-600 outline-none"
              placeholder="Nome do Personagem"
            />
          </div>
          <ImagePickerButton value={formData.icon} onUpdate={val => setFormData({ ...formData, icon: val })} label="Avatar do Personagem" buttonLabel="Avatar" showPreviewInline={!!formData.icon} previewHeight={80} />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Max HP</label>
              <input type="number" value={formData.maxHp} onChange={e => setFormData({ ...formData, maxHp: Number(e.target.value), currentHp: Number(e.target.value) })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 text-white font-black text-xl text-center focus:border-rose-600 outline-none" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Max Aura</label>
              <input type="number" value={formData.maxAura} onChange={e => setFormData({ ...formData, maxAura: Number(e.target.value), currentAura: Number(e.target.value) })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 text-white font-black text-xl text-center focus:border-amber-600 outline-none" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Max Munição 🎯</label>
              <input type="number" value={formData.maxAmmo || 0} onChange={e => setFormData({ ...formData, maxAmmo: Number(e.target.value), currentAmmo: Number(e.target.value) })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 text-white font-black text-xl text-center focus:border-orange-600 outline-none" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Iniciativa Base</label>
              <input type="number" value={formData.baseInitiative} onChange={e => setFormData({ ...formData, baseInitiative: Number(e.target.value) })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 text-white font-black text-xl text-center focus:border-slate-500 outline-none" />
           </div>
        </div>
      </div>

      {/* Role selector + Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Categoria</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'cast' })}
              className={`flex-1 py-3 rounded-2xl font-extrabold uppercase text-xs tracking-widest border transition-all ${(formData.role ?? 'npc') === 'cast' ? 'bg-amber-600 border-amber-400/50 text-white shadow-[0_0_15px_rgba(201,152,58,0.3)]' : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300'}`}
            >
              ⭐ Cast
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'npc' })}
              className={`flex-1 py-3 rounded-2xl font-extrabold uppercase text-xs tracking-widest border transition-all ${(formData.role ?? 'npc') === 'npc' ? 'bg-slate-700 border-slate-500/50 text-white shadow-md' : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300'}`}
            >
              👤 NPC
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">
            Código do Personagem
            {formData.id && <span className="ml-2 font-mono text-amber-500">#{formData.id.slice(0,8).toUpperCase()}</span>}
          </label>
          <input
            value={formData.code || ''}
            onChange={e => setFormData({ ...formData, code: e.target.value })}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-600 outline-none font-mono"
            placeholder="Código personalizado (ex: HERO01)"
          />
        </div>
      </div>

      {/* ── VÍNCULOS ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">⛓ Vínculos</label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, bonds: [...(prev.bonds || []), ''] }))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-900/40 border border-indigo-700/50 text-indigo-400 text-[9px] font-extrabold uppercase tracking-widest hover:bg-indigo-800/40 transition-all"
          >
            <Plus className="w-3 h-3" /> Adicionar Vínculo
          </button>
        </div>
        {(formData.bonds || []).length === 0 && (
          <p className="text-[10px] text-slate-600 italic pl-2">Nenhum vínculo definido. Vínculos podem ser requisitos de selos.</p>
        )}
        <div className="space-y-2">
          {(formData.bonds || []).map((bond, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                value={bond}
                onChange={e => {
                  const updated = [...(formData.bonds || [])];
                  updated[idx] = e.target.value;
                  setFormData(prev => ({ ...prev, bonds: updated }));
                }}
                placeholder={`Ex: Pacto de Sangue, Irmãos de Arma, Escolhido de Ignis…`}
                className="flex-1 bg-slate-900/80 border border-indigo-900/50 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:border-indigo-500 outline-none placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, bonds: (prev.bonds || []).filter((_, i) => i !== idx) }))}
                className="p-2 text-rose-500 hover:bg-rose-900/30 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Habilidades Conhecidas</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scroll p-2 border border-slate-800 rounded-2xl bg-slate-900/30">
          {cards.map(card => (
            <div 
              key={card.id} 
              onClick={() => toggleCard(card.id)}
              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${formData.cardIds.includes(card.id) ? 'bg-amber-950/60 border-amber-500' : 'bg-slate-900/80 border-slate-800 opacity-60 hover:opacity-100'}`}
            >
              <img src={card.image || undefined} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                 <p className="text-xs font-extrabold uppercase text-white truncate">{card.name}</p>
                 <p className="text-[9px] text-slate-400 uppercase">{card.type}</p>
              </div>
              {formData.cardIds.includes(card.id) && <Check className="w-4 h-4 text-amber-400" />}
            </div>
          ))}
          {cards.length === 0 && <p className="text-slate-500 text-xs p-4 text-center col-span-full">Nenhuma carta disponível no grimório.</p>}
        </div>
      </div>

      {/* ── STACKS ──────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Stacks Personalizados</label>
          <button
            onClick={() => setFormData(prev => ({
              ...prev,
              stacks: [...(prev.stacks || []), { id: Math.random().toString(36).substr(2,9), name: 'Stack', color: '#6366f1', current: 0, max: 10 }]
            }))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all"
            style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc' }}
          >
            <Plus className="w-3 h-3" /> Adicionar Stack
          </button>
        </div>
        {(formData.stacks || []).length === 0 && (
          <p className="text-[10px] text-slate-600 italic text-center py-2">Nenhum stack. Adicione contadores personalizados como Cargas, Pontos de Magia, etc.</p>
        )}
        <div className="space-y-2">
          {(formData.stacks || []).map((stack, idx) => (
            <div key={stack.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/50">
              <input
                type="color"
                value={stack.color}
                onChange={e => setFormData(prev => ({ ...prev, stacks: (prev.stacks||[]).map((s,i) => i===idx ? {...s, color: e.target.value} : s) }))}
                style={{ width:28, height:28, borderRadius:6, border:'none', cursor:'pointer', padding:0, background:'none' }}
                title="Cor do stack"
              />
              <input
                value={stack.name}
                onChange={e => setFormData(prev => ({ ...prev, stacks: (prev.stacks||[]).map((s,i) => i===idx ? {...s, name: e.target.value} : s) }))}
                placeholder="Nome do stack"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-indigo-500"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Val</span>
                <input
                  type="number" min={0}
                  value={stack.current}
                  onChange={e => setFormData(prev => ({ ...prev, stacks: (prev.stacks||[]).map((s,i) => i===idx ? {...s, current: parseInt(e.target.value)||0} : s) }))}
                  className="w-14 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs font-bold text-center outline-none"
                />
                <span className="text-slate-600">/</span>
                <input
                  type="number" min={1}
                  value={stack.max}
                  onChange={e => setFormData(prev => ({ ...prev, stacks: (prev.stacks||[]).map((s,i) => i===idx ? {...s, max: parseInt(e.target.value)||1} : s) }))}
                  className="w-14 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs font-bold text-center outline-none"
                />
              </div>
              <button
                onClick={() => setFormData(prev => ({ ...prev, stacks: (prev.stacks||[]).filter((_,i) => i!==idx) }))}
                className="p-1.5 rounded-lg hover:bg-rose-900/40 hover:text-rose-400 text-slate-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-slate-800">
        {initialData?.id && (
          <button onClick={() => onDelete(initialData.id)} className="px-6 py-4 bg-rose-950/50 text-rose-500 hover:bg-rose-900/50 border border-rose-900/30 rounded-2xl font-extrabold uppercase text-xs tracking-widest transition-colors">
            Excluir
          </button>
        )}
        <button onClick={() => onSubmit(formData)} className="flex-1 py-4 text-white rounded-2xl font-extrabold uppercase text-xs tracking-widest border border-amber-400/30" style={{ background: 'linear-gradient(135deg, #c9983a, #a07828)', boxShadow: '0 0 20px rgba(201,152,58,0.3)' }}>
          Salvar Personagem
        </button>
      </div>
    </div>
  );
};

// ─── BonusEditor: editor de bônus para cartas ação/reforço/combinação/forma ────
const BONUS_TYPE_LABELS: Record<string, string> = {
  healHp: '💚 Cura HP',
  recoverAura: '⚡ Recuperar Aura',
  recoverAmmo: '🎯 Recuperar Munição',
  rollBonusGeneral: '🎲 Bônus Geral de Rolagem',
  rollBonusByType: '🃏 Bônus por Tipo de Carta',
  rollBonusByElement: '✨ Bônus por Elemento',
};
const ELEMENTS = [
  { value: 'fogo', label: '🔥 Fogo' },
  { value: 'água', label: '💧 Água' },
  { value: 'terra', label: '🪨 Terra' },
  { value: 'vento', label: '🍃 Vento' },
  { value: 'raio',  label: '⚡ Raio'  },
];

// Tipos de dano disponíveis em todo o sistema
const DAMAGE_TYPES: { value: DamageType; label: string; color: string; emoji: string }[] = [
  { value: 'normal',    label: 'Normal',    color: '#94a3b8', emoji: '⚔️' },
  { value: 'fogo',      label: 'Fogo',      color: '#ef4444', emoji: '🔥' },
  { value: 'raio',      label: 'Raio',      color: '#facc15', emoji: '⚡' },
  { value: 'água',      label: 'Água',      color: '#38bdf8', emoji: '💧' },
  { value: 'terra',     label: 'Terra',     color: '#92400e', emoji: '🪨' },
  { value: 'vento',     label: 'Vento',     color: '#86efac', emoji: '🍃' },
  { value: 'escuridão', label: 'Escuridão', color: '#7c3aed', emoji: '🌑' },
  { value: 'luminoso',  label: 'Luminoso',  color: '#fde68a', emoji: '✨' },
  { value: 'sangue',    label: 'Sangue',    color: '#dc2626', emoji: '🩸' },
  { value: 'aura',      label: 'Aura',      color: '#67e8f9', emoji: '💠' },
];
const CARD_TYPES_FOR_BONUS: CardType[] = ['ataque','reação','ação','reforço','vínculo','combinação','forma'];

// ── Seletor de Tipo de Dano ──────────────────────────────────────────────────
const DamageTypeSelector: React.FC<{
  value?: DamageType;
  onChange: (v: DamageType) => void;
  small?: boolean;
}> = ({ value, onChange, small }) => {
  const current = DAMAGE_TYPES.find(d => d.value === (value || 'normal')) || DAMAGE_TYPES[0];
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display:'flex', alignItems:'center', gap:small?3:5,
          padding: small ? '3px 8px' : '7px 12px',
          borderRadius:10,
          background:`${current.color}18`,
          border:`1.5px solid ${current.color}55`,
          color:current.color,
          fontSize: small ? 9 : 11,
          fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
          transition:'all 0.15s',
        }}
      >
        <span style={{ fontSize: small ? 10 : 13 }}>{current.emoji}</span>
        <span>{current.label}</span>
        <ChevronDown style={{ width: small ? 8 : 10, height: small ? 8 : 10, opacity:0.6 }} />
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'110%', left:0, zIndex:9999,
          background:'#0f1117', border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:12, padding:6, display:'flex', flexWrap:'wrap', gap:4, width:220,
          boxShadow:'0 8px 32px rgba(0,0,0,0.8)',
        }}>
          {DAMAGE_TYPES.map(dt => (
            <button key={dt.value} type="button"
              onClick={() => { onChange(dt.value); setOpen(false); }}
              style={{
                display:'flex', alignItems:'center', gap:4, padding:'4px 8px',
                borderRadius:8, border:`1px solid ${dt.value === (value||'normal') ? dt.color : 'transparent'}`,
                background: dt.value === (value||'normal') ? `${dt.color}22` : 'rgba(255,255,255,0.04)',
                color: dt.value === (value||'normal') ? dt.color : 'rgba(255,255,255,0.6)',
                fontSize:10, fontWeight:700, cursor:'pointer', flex:'0 0 auto',
              }}
            >
              <span>{dt.emoji}</span><span>{dt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Seletor de Condição Pré-definida ─────────────────────────────────────────
const PresetConditionPicker: React.FC<{
  onSelect: (name: string, duration: number) => void;
}> = ({ onSelect }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display:'flex', alignItems:'center', gap:4,
          padding:'4px 10px', borderRadius:8,
          background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)',
          color:'#f59e0b', fontSize:9, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
        }}
      >
        <Star style={{width:8,height:8}}/>
        Pré-definidas
        <ChevronDown style={{width:8,height:8,opacity:0.6}}/>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'110%', left:0, zIndex:9999,
          background:'#0f1117', border:'1px solid rgba(245,158,11,0.2)',
          borderRadius:12, padding:8, width:260,
          boxShadow:'0 8px 32px rgba(0,0,0,0.8)',
        }}>
          <div style={{ fontSize:8, fontWeight:700, color:'rgba(245,158,11,0.5)', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:6 }}>
            Condições pré-definidas
          </div>
          {PRESET_CONDITIONS.map(pc => (
            <button key={pc.name} type="button"
              onClick={() => { onSelect(pc.name, pc.defaultDuration); setOpen(false); }}
              style={{
                width:'100%', display:'flex', alignItems:'flex-start', gap:6, padding:'6px 8px',
                borderRadius:8, border:'none', background:'transparent',
                cursor:'pointer', marginBottom:2,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize:14, lineHeight:1 }}>{pc.emoji}</span>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:10, fontWeight:700, color:pc.color }}>{pc.name}</div>
                <div style={{ fontSize:8, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{pc.description}</div>
              </div>
              <span style={{ marginLeft:'auto', fontSize:8, color:'rgba(255,255,255,0.25)', whiteSpace:'nowrap', flexShrink:0 }}>{pc.defaultDuration}t</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const BonusEditor: React.FC<{ bonuses: CardBonus[]; onChange: (b: CardBonus[]) => void }> = ({ bonuses, onChange }) => {
  const addBonus = () => {
    onChange([...bonuses, { type: 'healHp', value: 1, duration: 0 }]);
  };
  const updateBonus = (idx: number, patch: Partial<CardBonus>) => {
    const updated = bonuses.map((b, i) => i === idx ? { ...b, ...patch } : b);
    onChange(updated);
  };
  const removeBonus = (idx: number) => onChange(bonuses.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3 p-4 rounded-2xl border border-emerald-800/40 bg-emerald-950/10">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-widest flex items-center gap-2">🎁 Bônus ao Ativar</p>
        <button
          type="button"
          onClick={addBonus}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 text-[9px] font-extrabold uppercase tracking-widest hover:bg-emerald-800/40 transition-all"
        >
          <Plus className="w-3 h-3" /> Adicionar Bônus
        </button>
      </div>
      {bonuses.length === 0 && (
        <p className="text-[9px] text-slate-500 italic">Nenhum bônus configurado. Esta carta só tem os efeitos base.</p>
      )}
      {bonuses.map((bonus, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-emerald-900/40 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={bonus.type}
              onChange={e => updateBonus(idx, { type: e.target.value as CardBonus['type'] })}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-emerald-300 text-[10px] font-bold outline-none focus:border-emerald-600"
            >
              {Object.entries(BONUS_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <button type="button" onClick={() => removeBonus(idx)} className="p-1.5 text-rose-500 hover:bg-rose-900/30 rounded-lg transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[8px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">Valor</label>
              <input
                type="number"
                value={bonus.value}
                onChange={e => updateBonus(idx, { value: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-emerald-300 text-sm font-black text-center outline-none focus:border-emerald-600"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[8px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">Duração (0=perm)</label>
              <input
                type="number"
                min={0}
                value={bonus.duration ?? 0}
                onChange={e => updateBonus(idx, { duration: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 text-sm font-black text-center outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {bonus.type === 'rollBonusByType' && (
            <div className="space-y-0.5">
              <label className="text-[8px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">Tipo de Carta Alvo</label>
              <select
                value={bonus.targetCardType || 'ataque'}
                onChange={e => updateBonus(idx, { targetCardType: e.target.value as CardType })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 text-[10px] font-bold outline-none focus:border-emerald-600"
              >
                {CARD_TYPES_FOR_BONUS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {bonus.type === 'rollBonusByElement' && (
            <div className="space-y-0.5">
              <label className="text-[8px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">Elemento Alvo</label>
              <select
                value={bonus.targetElement || 'fogo'}
                onChange={e => updateBonus(idx, { targetElement: e.target.value as CardBonus['targetElement'] })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 text-[10px] font-bold outline-none focus:border-emerald-600"
              >
                {ELEMENTS.map(el => <option key={el.value} value={el.value}>{el.label}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-0.5">
            <label className="text-[8px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">Descrição do Bônus (Opcional)</label>
            <input
              value={bonus.label || ''}
              onChange={e => updateBonus(idx, { label: e.target.value })}
              placeholder="Ex: +3 em rolagens de Fogo"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 text-[10px] outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── ConditionEffectsEditor ────────────────────────────────────────────────────
const COND_EFFECT_LABELS: Record<ConditionEffectType, { label: string; emoji: string; color: string }> = {
  damage:      { label: 'Dano por rodada',       emoji: '🩸', color: '#f87171' },
  heal:        { label: 'Cura por rodada',        emoji: '💚', color: '#4ade80' },
  drainAura:   { label: 'Drenar Aura/rodada',     emoji: '🔥', color: '#fbbf24' },
  recoverAura: { label: 'Recuperar Aura/rodada',  emoji: '⚡', color: '#a78bfa' },
  drainAmmo:   { label: 'Drenar Munição/rodada',  emoji: '🎯', color: '#f97316' },
  recoverAmmo: { label: 'Recuperar Munição/rod.', emoji: '🔄', color: '#67e8f9' },
  dicePenalty: { label: 'Penalidade no dado',     emoji: '📉', color: '#fb923c' },
  diceBonus:   { label: 'Bônus no dado',          emoji: '📈', color: '#86efac' },
};

const ConditionEffectsEditor: React.FC<{
  conditionName: string;
  effects: ConditionEffect[];
  onChange: (effects: ConditionEffect[]) => void;
}> = ({ conditionName, effects, onChange }) => {
  const addEffect = () => onChange([...effects, { type: 'damage', value: 1 }]);
  const update = (i: number, patch: Partial<ConditionEffect>) => {
    const next = effects.map((e, idx) => idx === i ? { ...e, ...patch } : e);
    onChange(next);
  };
  const remove = (i: number) => onChange(effects.filter((_, idx) => idx !== i));

  return (
    <div style={{ background: 'rgba(120,60,10,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '10px 12px', marginTop: 4 }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#f59e0b' }}>
          ✦ Efeitos de <span style={{ color: '#fcd34d' }}>{conditionName}</span> por rodada
        </span>
        <button
          type="button"
          onClick={addEffect}
          style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          className="hover:bg-amber-500/20 transition-colors"
        >+ Efeito</button>
      </div>

      {effects.length === 0 && (
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '6px 0' }}>
          Nenhum efeito. Clique em "+ Efeito" para adicionar.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {effects.map((eff, i) => {
          const meta = COND_EFFECT_LABELS[eff.type];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.25)', borderRadius: 9, padding: '6px 8px', border: `1px solid ${meta.color}22` }}>
              {/* Effect type selector */}
              <select
                value={eff.type}
                onChange={e => update(i, { type: e.target.value as ConditionEffectType })}
                style={{ flex: 1, fontSize: 10, fontWeight: 700, background: '#1e2230', border: `1px solid ${meta.color}55`, borderRadius: 7, padding: '5px 6px', color: meta.color, outline: 'none', cursor: 'pointer' }}
              >
                {(Object.entries(COND_EFFECT_LABELS) as [ConditionEffectType, typeof COND_EFFECT_LABELS[keyof typeof COND_EFFECT_LABELS]][]).map(([val, m]) => (
                  <option key={val} value={val}>{m.emoji} {m.label}</option>
                ))}
              </select>

              {/* Dice roll (optional) */}
              <input
                type="text"
                placeholder="dado (ex: 1d6)"
                value={eff.diceRoll ?? ''}
                onChange={e => update(i, { diceRoll: e.target.value || undefined })}
                style={{ width: 80, fontSize: 10, fontWeight: 700, background: '#1e2230', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 6px', color: 'rgba(255,255,255,0.7)', outline: 'none', textAlign: 'center' }}
              />

              {/* Flat value (used when no diceRoll, or as bonus to dice) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{eff.diceRoll ? '±' : '#'}</span>
                <input
                  type="number"
                  min={0}
                  value={eff.value}
                  onChange={e => update(i, { value: Math.max(0, Number(e.target.value)) })}
                  style={{ width: 48, fontSize: 11, fontWeight: 800, background: '#1e2230', border: `1px solid ${meta.color}55`, borderRadius: 7, padding: '5px 4px', color: meta.color, outline: 'none', textAlign: 'center' }}
                />
              </div>

              <button
                type="button"
                onClick={() => remove(i)}
                style={{ padding: '4px 6px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: 10 }}
                className="hover:bg-rose-500/20 transition-colors"
              >✕</button>
            </div>
          );
        })}
      </div>

      {effects.length > 0 && (
        <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 6, textAlign: 'right' }}>
          Efeitos aplicados ao <em>início de cada rodada</em> enquanto a condição estiver ativa
        </p>
      )}
    </div>
  );
};

const CardForm: React.FC<{ initialData?: Card; onSubmit: (c: Card) => void; onDelete: (id: string) => void }> = ({ initialData, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState<Card>(initialData?.id ? initialData : {
    id: '', name: '', image: '', type: 'ataque', auraCost: 0, diceRoll: '1d20', description: '', damage: 0, isAreaEffect: false
  });
  const [editingLevelIdx, setEditingLevelIdx] = useState<number | null>(null);
  const [levelDraft, setLevelDraft] = useState<Partial<CardLevel>>({});

  const isCombo = formData.type === 'combinação';

  const addLevel = () => {
    const nextNum = (formData.levels?.length ?? 0) + 2; // level 1 = base
    const newLevel: CardLevel = {
      level: nextNum,
      name: formData.name,
      auraCost: formData.auraCost,
      diceRoll: formData.diceRoll,
      damage: formData.damage,
      dc: formData.dc,
      conditionEffect: formData.conditionEffect,
      conditionDuration: formData.conditionDuration,
      description: formData.description,
    };
    const newLevels = [...(formData.levels || []), newLevel];
    setFormData({ ...formData, levels: newLevels });
    setEditingLevelIdx(newLevels.length - 1);
    setLevelDraft(newLevel);
  };

  const saveLevel = (idx: number) => {
    const newLevels = [...(formData.levels || [])];
    newLevels[idx] = { ...newLevels[idx], ...levelDraft };
    setFormData({ ...formData, levels: newLevels });
    setEditingLevelIdx(null);
    setLevelDraft({});
  };

  const removeLevel = (idx: number) => {
    const newLevels = (formData.levels || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, levels: newLevels.length ? newLevels : undefined });
    setEditingLevelIdx(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Nome</label>
            <input 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              className="bg-slate-900/80 border-slate-800 w-full border rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-600 outline-none"
              placeholder="Nome da Habilidade"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Tipo</label>
            <div className="grid grid-cols-4 gap-2">
               {(['ataque', 'reação', 'ação', 'reforço', 'vínculo', 'combinação', 'forma'] as CardType[]).map(t => {
                 const colors: Record<string, string> = {
                   combinação: 'bg-purple-700 border-purple-400',
                   forma: 'bg-amber-500 border-amber-300',
                 };
                 const icons: Record<string, string> = { combinação: '🔗 ', forma: '✦ ' };
                 const activeClass = formData.type === t ? (colors[t] || 'bg-amber-600 border-amber-400') + ' text-white' : 'bg-slate-900/80 text-slate-500 border-slate-800 hover:bg-slate-900';
                 return (
                   <button
                     key={t}
                     onClick={() => setFormData({ ...formData, type: t })}
                     className={`px-2 py-3 rounded-xl text-[10px] font-extrabold uppercase border transition-all ${activeClass}`}
                     style={formData.type === t && t === 'combinação' ? { boxShadow: '0 0 14px rgba(168,85,247,0.5)' }
                           : formData.type === t && t === 'forma' ? { boxShadow: `0 0 14px ${formData.formaColor || 'rgba(251,191,36,0.5)'}` }
                           : {}}
                   >
                     {icons[t] || ''}{t}
                   </button>
                 );
               })}
            </div>
          </div>
          <ImagePickerButton value={formData.image} onUpdate={val => setFormData({ ...formData, image: val })} label="Imagem da Habilidade" buttonLabel="Imagem" showPreviewInline={!!formData.image} previewHeight={80} />
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Comando</label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { id: 'ataque', label: 'Ataque', icon: ATTACK_ICON_B64, color: 'bg-red-700 border-red-400' },
                { id: 'vínculo', label: 'Vínculo', icon: VINCULO_ICON_B64, color: 'bg-purple-700 border-purple-400' },
                { id: 'item', label: 'Item', icon: ITEMS_ICON_B64, color: 'bg-green-700 border-green-400' },
                { id: 'foco', label: 'Foco', icon: FOCO_ICON_B64, color: 'bg-cyan-700 border-cyan-400' },
              ] as { id: CommandType; label: string; icon: string; color: string }[]).map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => setFormData({ ...formData, command: formData.command === cmd.id ? undefined : cmd.id })}
                  className={`px-2 py-2 rounded-xl text-[9px] font-extrabold uppercase border transition-all flex flex-col items-center gap-1 ${formData.command === cmd.id ? cmd.color + ' text-white' : 'bg-slate-900/80 text-slate-500 border-slate-800 hover:bg-slate-900'}`}
                >
                  <img src={cmd.icon} style={{ width: 18, height: 18, objectFit: 'contain', opacity: formData.command === cmd.id ? 1 : 0.4 }} />
                  {cmd.label}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-600 ml-2">Deixe em branco para mostrar em todos os comandos.</p>
          </div>
        </div>

        <div className="space-y-4">
           <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">⚡ Custo Aura</label>
                 <input type="number" value={formData.auraCost} onChange={e => setFormData({ ...formData, auraCost: Number(e.target.value) })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 text-white font-black text-xl text-center focus:border-cyan-600 outline-none" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">🎯 Custo Munição</label>
                 <input type="number" value={formData.ammoCost || 0} onChange={e => setFormData({ ...formData, ammoCost: Number(e.target.value) })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 text-white font-black text-xl text-center focus:border-orange-600 outline-none" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Rolagem</label>
                 <input type="text" value={formData.diceRoll} onChange={e => setFormData({ ...formData, diceRoll: e.target.value })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 text-white font-black text-xl text-center focus:border-amber-600 outline-none" placeholder="1d20" />
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Dano (Opcional)</label>
                 <input type="number" value={formData.damage || 0} onChange={e => setFormData({ ...formData, damage: Number(e.target.value) })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 text-white font-black text-xl text-center focus:border-rose-600 outline-none" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">CD (Opcional)</label>
                 <input type="number" value={formData.dc || 0} onChange={e => setFormData({ ...formData, dc: Number(e.target.value) })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 text-white font-black text-xl text-center focus:border-emerald-600 outline-none" />
              </div>
           </div>
           {(formData.damage || 0) > 0 && (
             <div className="space-y-2">
               <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Tipo de Dano</label>
               <DamageTypeSelector value={(formData as any).damageType || 'normal'} onChange={v => setFormData({ ...formData, damageType: v } as any)} />
             </div>
           )}

           <div className="space-y-3">
               <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Efeito de Condição (Opcional)</label>
               <div className="flex gap-2 items-center">
                 <PresetConditionPicker onSelect={(name, dur) => setFormData({ ...formData, conditionEffect: name, conditionDuration: dur })} />
               </div>
               <div className="flex gap-2">
                  <input type="text" placeholder="Nome (Ex: Atordoado)" value={formData.conditionEffect || ''} onChange={e => setFormData({ ...formData, conditionEffect: e.target.value })} className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:border-amber-600 outline-none" />
                  <input type="number" placeholder="Dur." value={formData.conditionDuration || 3} onChange={e => setFormData({ ...formData, conditionDuration: Number(e.target.value) })} className="w-20 bg-slate-900/80 border border-slate-800 rounded-2xl px-2 py-3 text-white text-sm text-center focus:border-amber-600 outline-none" />
               </div>
               {/* Per-condition round effects */}
               {formData.conditionEffect && (
                 <ConditionEffectsEditor
                   conditionName={formData.conditionEffect}
                   effects={(formData.conditionEffects || {})[formData.conditionEffect] || []}
                   onChange={effects => {
                     const newMap = { ...(formData.conditionEffects || {}) };
                     if (effects.length === 0) { delete newMap[formData.conditionEffect!]; }
                     else { newMap[formData.conditionEffect!] = effects; }
                     setFormData({ ...formData, conditionEffects: Object.keys(newMap).length ? newMap : undefined });
                   }}
                 />
               )}
           </div>

           {/* Combination fields */}
           {isCombo && (
             <div className="space-y-3 p-4 rounded-2xl border border-purple-800/50 bg-purple-950/20">
               <p className="text-[10px] font-extrabold uppercase text-purple-400 tracking-widest mb-1">⚙️ Configuração de Combinação</p>
               
               <div className="flex items-center gap-3">
                 <button
                   type="button"
                   onClick={() => setFormData({ ...formData, comboFixedUsers: !formData.comboFixedUsers })}
                   className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-[10px] font-extrabold uppercase ${formData.comboFixedUsers ? 'bg-purple-700 border-purple-500 text-white' : 'bg-slate-900/80 border-slate-800 text-slate-500'}`}
                 >
                   <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${formData.comboFixedUsers ? 'bg-purple-500 border-purple-400' : 'border-slate-600'}`}>
                     {formData.comboFixedUsers && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                   </div>
                   Nº Fixo de Usuários
                 </button>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-[9px] font-extrabold uppercase text-purple-500 tracking-widest ml-1">{formData.comboFixedUsers ? 'Nº Exato' : 'Mínimo'} de Usuários</label>
                   <input
                     type="number"
                     min={2}
                     value={formData.comboMinUsers ?? 2}
                     onChange={e => setFormData({ ...formData, comboMinUsers: Math.max(2, Number(e.target.value)) })}
                     className="w-full bg-slate-900/80 border border-purple-800/50 rounded-xl px-3 py-3 text-white font-black text-lg text-center focus:border-purple-500 outline-none"
                   />
                 </div>
                 {!formData.comboFixedUsers && (
                   <div className="space-y-1">
                     <label className="text-[9px] font-extrabold uppercase text-purple-500 tracking-widest ml-1">Máximo (0 = ilimitado)</label>
                     <input
                       type="number"
                       min={0}
                       value={formData.comboMaxUsers ?? 0}
                       onChange={e => setFormData({ ...formData, comboMaxUsers: Number(e.target.value) })}
                       className="w-full bg-slate-900/80 border border-purple-800/50 rounded-xl px-3 py-3 text-white font-black text-lg text-center focus:border-purple-500 outline-none"
                     />
                   </div>
                 )}
               </div>

               <div className="space-y-1">
                 <label className="text-[9px] font-extrabold uppercase text-purple-500 tracking-widest ml-1">Modo de Resolução dos Dados</label>
                 <div className="grid grid-cols-2 gap-2">
                   {([{v:'sum',l:'Soma dos Dados',e:'➕'},{v:'highest',l:'Maior Dado',e:'🏆'}] as const).map(opt => (
                     <button
                       key={opt.v}
                       type="button"
                       onClick={() => setFormData({ ...formData, comboDiceMode: opt.v })}
                       className={`py-2.5 px-3 rounded-xl border text-[10px] font-extrabold flex items-center gap-2 transition-all ${(formData.comboDiceMode ?? 'sum') === opt.v ? 'bg-purple-700 border-purple-500 text-white' : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:border-purple-800'}`}
                     >
                       <span>{opt.e}</span>{opt.l}
                     </button>
                   ))}
                 </div>
               </div>
             </div>
           )}

           {/* Area Effect toggle — hidden for combo cards */}
           {!isCombo && (
             <button
               type="button"
               onClick={() => setFormData({ ...formData, isAreaEffect: !formData.isAreaEffect })}
               className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all ${formData.isAreaEffect ? 'bg-orange-950/40 border-orange-600/60 text-orange-300' : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:border-slate-600'}`}
             >
               <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${formData.isAreaEffect ? 'bg-orange-600 border-orange-500' : 'border-slate-600'}`}>
                 {formData.isAreaEffect && <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
               </div>
               <div className="flex-1 text-left">
                 <p className="text-[11px] font-extrabold uppercase tracking-widest">Efeito em Área</p>
                 <p className="text-[9px] mt-0.5 opacity-60">Permite selecionar múltiplos alvos simultaneamente</p>
               </div>
               <span className="text-lg">{formData.isAreaEffect ? '💥' : '◎'}</span>
             </button>
           )}

           {/* Element selector */}
           <div className="space-y-2">
             <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Elemento (Opcional)</label>
             <div className="grid grid-cols-6 gap-2">
               <button
                 type="button"
                 onClick={() => setFormData({ ...formData, element: undefined } as any)}
                 className={`py-2.5 rounded-xl text-[10px] font-extrabold border transition-all flex flex-col items-center gap-1 ${!(formData as any).element ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:border-slate-600'}`}
               >
                 <span className="text-sm">—</span>
                 <span>Nenhum</span>
               </button>
               {([
                 { value: 'fogo',  emoji: '🔥', label: 'Fogo',  color: '#ef4444' },
                 { value: 'água',  emoji: '💧', label: 'Água',  color: '#3b82f6' },
                 { value: 'terra', emoji: '🪨', label: 'Terra', color: '#92400e' },
                 { value: 'vento', emoji: '🍃', label: 'Vento', color: '#86efac' },
                 { value: 'raio',  emoji: '⚡', label: 'Raio',  color: '#facc15' },
               ] as Array<{value: string; emoji: string; label: string; color: string}>).map(el => (
                 <button
                   key={el.value}
                   type="button"
                   onClick={() => setFormData({ ...formData, element: el.value } as any)}
                   className={`py-2.5 rounded-xl text-[10px] font-extrabold border transition-all flex flex-col items-center gap-1 ${(formData as any).element === el.value ? 'text-white' : 'bg-slate-900/80 text-slate-500 hover:border-slate-600 border-slate-800'}`}
                   style={(formData as any).element === el.value ? {
                     background: `${el.color}22`,
                     borderColor: el.color,
                     boxShadow: `0 0 12px ${el.color}44`,
                   } : {}}
                 >
                   <span className="text-lg">{el.emoji}</span>
                   <span style={(formData as any).element === el.value ? { color: el.color } : {}}>{el.label}</span>
                 </button>
               ))}
             </div>
           </div>
        </div>
      </div>
      
      <div className="space-y-2">
         <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Descrição</label>
         <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-6 py-4 text-white text-sm focus:border-amber-600 outline-none min-h-[100px]" placeholder="Descreva os efeitos..." />
      </div>

      {/* ── FORMA CONFIG ── */}
      {formData.type === 'forma' && (
        <div className="space-y-4 p-5 rounded-2xl border border-amber-500/40 bg-amber-950/15">
          <p className="text-[10px] font-extrabold uppercase text-amber-400 tracking-widest flex items-center gap-2">✦ Configuração de Forma</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-extrabold uppercase text-amber-500/70 tracking-widest ml-1">Cor da Forma</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.formaColor || '#f59e0b'}
                  onChange={e => setFormData({ ...formData, formaColor: e.target.value })}
                  style={{ width:44, height:44, borderRadius:10, border:'2px solid rgba(245,158,11,0.4)', padding:2, cursor:'pointer', background:'transparent' }}
                />
                <div>
                  <p className="text-xs font-bold text-white">{formData.formaColor || '#f59e0b'}</p>
                  <p className="text-[9px] text-slate-500">Cor do brilho e animação</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-extrabold uppercase text-amber-500/70 tracking-widest ml-1">Ícone Customizado</label>
              <ImagePickerButton
                value={formData.formaIcon || ''}
                onUpdate={val => setFormData({ ...formData, formaIcon: val })}
                label="Ícone da Forma"
                accentColor={formData.formaColor || '#f59e0b'}
                previewHeight={48}
                showPreviewInline={!!formData.formaIcon}
                placement="bottom-left"
              />
              <p className="text-[9px] text-slate-500 ml-1">Substitui o avatar do personagem</p>
            </div>
          </div>

          {/* Duração e bônus de status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-amber-500/70 tracking-widest ml-1">Duração (rodadas)</label>
              <input
                type="number"
                min={0}
                value={formData.formaDuration ?? 0}
                onChange={e => setFormData({ ...formData, formaDuration: Number(e.target.value) })}
                className="w-full bg-slate-900/60 border border-amber-800/40 rounded-xl px-3 py-2 text-amber-200 text-sm font-black text-center focus:border-amber-500 outline-none"
                placeholder="0 = perm"
              />
              <p className="text-[9px] text-slate-500 ml-1">0 = permanente</p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-amber-500/70 tracking-widest ml-1">❤ Bônus HP Máx</label>
              <input
                type="number"
                value={formData.formaHpBonus ?? 0}
                onChange={e => setFormData({ ...formData, formaHpBonus: Number(e.target.value) })}
                className="w-full bg-slate-900/60 border border-rose-800/40 rounded-xl px-3 py-2 text-rose-300 text-sm font-black text-center focus:border-rose-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-amber-500/70 tracking-widest ml-1">⚡ Bônus Aura Máx</label>
              <input
                type="number"
                value={formData.formaAuraBonus ?? 0}
                onChange={e => setFormData({ ...formData, formaAuraBonus: Number(e.target.value) })}
                className="w-full bg-slate-900/60 border border-amber-800/40 rounded-xl px-3 py-2 text-amber-200 text-sm font-black text-center focus:border-amber-500 outline-none"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-extrabold uppercase text-amber-500/70 tracking-widest ml-1">Cartas Desbloqueadas (IDs)</label>
            <p className="text-[9px] text-slate-500 ml-1">Cartas disponíveis enquanto a forma estiver ativa. Cole os IDs separados por vírgula.</p>
            <textarea
              value={(formData.formaCardIds || []).join(', ')}
              onChange={e => {
                const ids = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                setFormData({ ...formData, formaCardIds: ids });
              }}
              placeholder="id-carta-1, id-carta-2, ..."
              className="w-full bg-slate-900/60 border border-amber-800/40 rounded-xl px-4 py-3 text-amber-200 text-xs font-mono focus:border-amber-500 outline-none min-h-[60px] resize-none"
            />
          </div>
        </div>
      )}

      {/* ── BONUS SYSTEM (for ação, reforço, combinação, forma) ── */}
      {(['ação', 'reforço', 'combinação', 'forma'] as CardType[]).includes(formData.type) && (
        <BonusEditor
          bonuses={formData.bonuses || []}
          onChange={bonuses => setFormData({ ...formData, bonuses })}
        />
      )}

      {/* ── LEVEL EVOLUTION ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Evolução de Níveis</p>
            <p className="text-[9px] text-slate-600 ml-2 mt-0.5">Nível 1 = dados base acima. Adicione níveis com atributos alternativos.</p>
          </div>
          <button
            type="button"
            onClick={addLevel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-900/40 border border-amber-700/50 text-amber-400 text-[10px] font-extrabold uppercase tracking-widest hover:bg-amber-800/40 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Nível {(formData.levels?.length ?? 0) + 2}
          </button>
        </div>

        {/* Level list */}
        {formData.levels && formData.levels.length > 0 && (
          <div className="space-y-2">
            {formData.levels.map((lv, idx) => (
              <div key={idx} className="rounded-2xl border border-amber-900/40 bg-slate-900/50 overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-slate-800/40"
                  onClick={() => {
                    if (editingLevelIdx === idx) { setEditingLevelIdx(null); }
                    else { setEditingLevelIdx(idx); setLevelDraft({ ...lv }); }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-700/30 border border-amber-600/40 text-amber-300 text-sm font-extrabold flex items-center justify-center">{lv.level}</span>
                    <span className="text-white text-sm font-bold">{lv.name || formData.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{lv.diceRoll || formData.diceRoll} · ⚡{lv.auraCost ?? formData.auraCost}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeLevel(idx); }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-900/30 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${editingLevelIdx === idx ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {editingLevelIdx === idx && (
                  <div className="p-4 border-t border-amber-900/30 space-y-3 bg-slate-950/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">Nome (Opcional)</label>
                        <input value={levelDraft.name ?? ''} onChange={e => setLevelDraft({...levelDraft, name: e.target.value})} placeholder={formData.name} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-600 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">Rolagem</label>
                        <input value={levelDraft.diceRoll ?? ''} onChange={e => setLevelDraft({...levelDraft, diceRoll: e.target.value})} placeholder={formData.diceRoll} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-mono text-center focus:border-amber-600 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">⚡ Aura</label>
                        <input type="number" value={levelDraft.auraCost ?? ''} onChange={e => setLevelDraft({...levelDraft, auraCost: Number(e.target.value)})} placeholder={String(formData.auraCost)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white text-sm font-black text-center focus:border-cyan-600 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">⚔ Dano</label>
                        <input type="number" value={levelDraft.damage ?? ''} onChange={e => setLevelDraft({...levelDraft, damage: Number(e.target.value)})} placeholder={String(formData.damage ?? 0)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white text-sm font-black text-center focus:border-rose-600 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">CD</label>
                        <input type="number" value={levelDraft.dc ?? ''} onChange={e => setLevelDraft({...levelDraft, dc: Number(e.target.value)})} placeholder={String(formData.dc ?? 0)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white text-sm font-black text-center focus:border-emerald-600 outline-none" />
                      </div>
                    </div>
                    {((levelDraft.damage ?? formData.damage) || 0) > 0 && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">Tipo de Dano</label>
                        <DamageTypeSelector small value={(levelDraft as any).damageType || (formData as any).damageType || 'normal'} onChange={v => setLevelDraft({...levelDraft, damageType: v} as any)} />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">Condição</label>
                      <div className="flex gap-2 items-center mb-1">
                        <PresetConditionPicker onSelect={(name, dur) => setLevelDraft({...levelDraft, conditionEffect: name, conditionDuration: dur})} />
                      </div>
                      <div className="flex gap-2">
                        <input value={levelDraft.conditionEffect ?? ''} onChange={e => setLevelDraft({...levelDraft, conditionEffect: e.target.value})} placeholder={formData.conditionEffect || 'Nome...'} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-600 outline-none" />
                        <input type="number" value={levelDraft.conditionDuration ?? ''} onChange={e => setLevelDraft({...levelDraft, conditionDuration: Number(e.target.value)})} placeholder="Dur." className="w-16 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white text-sm text-center focus:border-amber-600 outline-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-widest ml-1">Descrição do Nível</label>
                      <textarea value={levelDraft.description ?? ''} onChange={e => setLevelDraft({...levelDraft, description: e.target.value})} placeholder={formData.description} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-600 outline-none min-h-[70px]" />
                    </div>
                    <button
                      type="button"
                      onClick={() => saveLevel(idx)}
                      className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-[10px] font-extrabold uppercase tracking-widest transition-all"
                    >
                      <Check className="w-3.5 h-3.5 inline mr-2" />Salvar Nível {lv.level}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4 border-t border-slate-800">
        {initialData?.id && (
          <button onClick={() => onDelete(initialData.id)} className="px-6 py-4 bg-rose-950/50 text-rose-500 hover:bg-rose-900/50 border border-rose-900/30 rounded-2xl font-extrabold uppercase text-xs tracking-widest transition-colors">
            Excluir
          </button>
        )}
        <div className="flex-1 flex flex-col gap-3">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">
              Código da Habilidade
              {initialData?.id && <span className="ml-2 font-mono text-amber-500">#{initialData.id.slice(0,8).toUpperCase()}</span>}
            </label>
            <input
              value={formData.code || ''}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-6 py-3 text-white font-bold focus:border-amber-600 outline-none font-mono text-sm"
              placeholder="Código personalizado (ex: FIRE01)"
            />
          </div>
          <button onClick={() => onSubmit(formData)} className="w-full py-4 text-white rounded-2xl font-extrabold uppercase text-xs tracking-widest border border-amber-400/30" style={{ background: 'linear-gradient(135deg, #c9983a, #a07828)', boxShadow: '0 0 20px rgba(201,152,58,0.3)' }}>
            Salvar Habilidade
          </button>
        </div>
      </div>
    </div>
  );
};

const ItemForm: React.FC<{ initialData?: Item; onSubmit: (item: Item) => void; onDelete: (id: string) => void }> = ({ initialData, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState<Item>(initialData?.id ? initialData : {
    id: '', name: '', description: '', image: '', link: '', quantity: 1, usableInCombat: false
  });

  const set = (patch: Partial<Item>) => setFormData(prev => ({ ...prev, ...patch }));

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Nome do Item</label>
          <input 
            value={formData.name} 
            onChange={e => set({ name: e.target.value })} 
            className="bg-slate-900/80 border-slate-800 w-full border rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-600 outline-none"
            placeholder="Ex: Poção de Cura"
          />
        </div>
        <ImagePickerButton value={formData.image} onUpdate={val => set({ image: val })} label="Imagem do Item" buttonLabel="Imagem" showPreviewInline={!!formData.image} previewHeight={80} />
      </div>

      <div className="space-y-2">
         <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Descrição</label>
         <textarea value={formData.description} onChange={e => set({ description: e.target.value })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-6 py-4 text-white text-sm focus:border-amber-600 outline-none min-h-[100px]" placeholder="Efeitos e detalhes..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Quantidade</label>
          <input type="number" min="1" value={formData.quantity || 1} onChange={e => set({ quantity: Math.max(1, Number(e.target.value)) })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 text-white font-black text-xl text-center focus:border-amber-600 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Categoria</label>
          <select value={formData.category || ''} onChange={e => set({ category: e.target.value })} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 text-white font-bold text-sm focus:border-amber-600 outline-none">
            <option value="">Misc</option>
            <option value="weapon">⚔ Arma</option>
            <option value="armor">🛡 Armadura</option>
            <option value="consumable">🧪 Consumível</option>
            <option value="special">✨ Especial</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest ml-2">Link Externo (Opcional)</label>
        <div className="flex gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 focus-within:border-amber-600 transition-colors">
           <LinkIcon className="w-5 h-5 text-slate-500" />
           <input 
             value={formData.link || ''} 
             onChange={e => set({ link: e.target.value })} 
             className="flex-1 bg-transparent outline-none text-white text-sm"
             placeholder="https://..."
           />
        </div>
      </div>

      {/* ── COMBAT USAGE SECTION ── */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => set({ usableInCombat: !formData.usableInCombat })}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all ${formData.usableInCombat ? 'bg-emerald-950/40 border-emerald-600/60' : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'}`}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${formData.usableInCombat ? 'bg-emerald-600 border-emerald-500' : 'border-slate-600'}`}>
            {formData.usableInCombat && <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <div className="flex-1 text-left">
            <p className={`text-[11px] font-extrabold uppercase tracking-widest ${formData.usableInCombat ? 'text-emerald-300' : 'text-slate-500'}`}>⚔ Usável em Combate</p>
            <p className={`text-[9px] mt-0.5 ${formData.usableInCombat ? 'text-emerald-500/60' : 'text-slate-600'}`}>Aparece no menu de Itens durante o combate</p>
          </div>
          <span className="text-lg">{formData.usableInCombat ? '🟢' : '⚪'}</span>
        </button>

        {formData.usableInCombat && (
          <div className="space-y-4 p-5 rounded-2xl border border-emerald-800/40 bg-emerald-950/10 anim-fade">
            <p className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-widest flex items-center gap-2">⚔ Efeitos em Combate <span className="text-slate-600 font-normal normal-case tracking-normal">(todos opcionais)</span></p>

            {/* Row 1: heal, damage, dice */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-emerald-500/70 tracking-widest ml-1">💚 Cura (HP)</label>
                <input type="number" min="0" value={formData.combatHeal ?? ''} onChange={e => set({ combatHeal: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-emerald-800/40 rounded-xl px-3 py-2.5 text-emerald-300 text-sm font-black text-center focus:border-emerald-500 outline-none" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-rose-500/70 tracking-widest ml-1">⚔ Dano</label>
                <input type="number" min="0" value={formData.combatDamage ?? ''} onChange={e => set({ combatDamage: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-rose-800/40 rounded-xl px-3 py-2.5 text-rose-300 text-sm font-black text-center focus:border-rose-500 outline-none" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-amber-500/70 tracking-widest ml-1">🎲 Dado</label>
                <input type="text" value={formData.combatDiceRoll ?? ''} onChange={e => set({ combatDiceRoll: e.target.value || undefined })}
                  className="w-full bg-slate-900/60 border border-amber-800/40 rounded-xl px-3 py-2.5 text-amber-200 text-sm font-mono text-center focus:border-amber-500 outline-none" placeholder="1d6" />
              </div>
            </div>

            {/* Row 2: aura, ammo, dc */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-cyan-500/70 tracking-widest ml-1">⚡ Rec. Aura</label>
                <input type="number" min="0" value={formData.combatAuraRecover ?? ''} onChange={e => set({ combatAuraRecover: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-cyan-800/40 rounded-xl px-3 py-2.5 text-cyan-300 text-sm font-black text-center focus:border-cyan-500 outline-none" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-orange-500/70 tracking-widest ml-1">🎯 Rec. Munição</label>
                <input type="number" min="0" value={formData.combatAmmoRecover ?? ''} onChange={e => set({ combatAmmoRecover: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-orange-800/40 rounded-xl px-3 py-2.5 text-orange-300 text-sm font-black text-center focus:border-orange-500 outline-none" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-500/70 tracking-widest ml-1">◎ CD</label>
                <input type="number" min="0" value={formData.combatDc ?? ''} onChange={e => set({ combatDc: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl px-3 py-2.5 text-slate-300 text-sm font-black text-center focus:border-slate-500 outline-none" placeholder="0" />
              </div>
            </div>

            {/* Damage type (if damage > 0) */}
            {(formData.combatDamage || 0) > 0 && (
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-rose-500/70 tracking-widest ml-1">Tipo de Dano</label>
                <DamageTypeSelector small value={(formData as any).combatDamageType || 'normal'} onChange={v => set({ combatDamageType: v } as any)} />
              </div>
            )}

            {/* Row 3: condition */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-purple-500/70 tracking-widest ml-1">✦ Condição Aplicada</label>
              <div className="flex gap-2 items-center mb-1">
                <PresetConditionPicker onSelect={(name, dur) => set({ combatConditionEffect: name, combatConditionDuration: dur })} />
              </div>
              <div className="flex gap-2">
                <input type="text" value={formData.combatConditionEffect ?? ''} onChange={e => set({ combatConditionEffect: e.target.value || undefined })}
                  className="flex-1 bg-slate-900/60 border border-purple-800/40 rounded-xl px-3 py-2.5 text-purple-200 text-sm focus:border-purple-500 outline-none" placeholder="Nome da condição..." />
                <input type="number" min="1" value={formData.combatConditionDuration ?? ''} onChange={e => set({ combatConditionDuration: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-20 bg-slate-900/60 border border-purple-800/40 rounded-xl px-3 py-2.5 text-purple-300 text-sm font-black text-center focus:border-purple-500 outline-none" placeholder="Dur." />
              </div>
            </div>

            {/* Row: ammo cost + targeting */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-orange-500/70 tracking-widest ml-1">🎯 Consome Munição</label>
                <input type="number" min="0" value={formData.combatAmmoCost ?? ''} onChange={e => set({ combatAmmoCost: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-orange-800/40 rounded-xl px-3 py-2.5 text-orange-300 text-sm font-black text-center focus:border-orange-500 outline-none" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-sky-500/70 tracking-widest ml-1">🎯 Alvo</label>
                <select value={formData.combatTargeting ?? 'self'} onChange={e => set({ combatTargeting: e.target.value as any })}
                  className="w-full bg-slate-900/60 border border-sky-800/40 rounded-xl px-3 py-2.5 text-sky-200 text-sm font-bold focus:border-sky-500 outline-none">
                  <option value="self">A si mesmo</option>
                  <option value="other">Outro personagem</option>
                  <option value="area">Área (todos)</option>
                  <option value="choice">Escolher ao usar</option>
                </select>
              </div>
            </div>

            {/* Consume on use */}
            <button
              type="button"
              onClick={() => set({ consumeOnUse: !formData.consumeOnUse })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${formData.consumeOnUse ? 'bg-rose-950/30 border-rose-700/50' : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${formData.consumeOnUse ? 'bg-rose-600 border-rose-500' : 'border-slate-600'}`}>
                {formData.consumeOnUse && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-[10px] font-extrabold uppercase tracking-widest ${formData.consumeOnUse ? 'text-rose-400' : 'text-slate-500'}`}>Consumir ao usar</p>
                <p className="text-[9px] text-slate-600 mt-0.5">Reduz a quantidade em 1 quando utilizado em combate</p>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4 border-t border-slate-800">
        {initialData?.id && (
          <button onClick={() => onDelete(initialData.id)} className="px-6 py-4 bg-rose-950/50 text-rose-500 hover:bg-rose-900/50 border border-rose-900/30 rounded-2xl font-extrabold uppercase text-xs tracking-widest transition-colors">
            Excluir
          </button>
        )}
        <button onClick={() => onSubmit(formData)} className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-extrabold uppercase text-xs tracking-widest shadow-xl transition-all">
          {initialData?.id ? 'Salvar Alterações' : 'Adicionar ao Inventário'}
        </button>
      </div>
    </div>
  );
};

// --- ImagePickerButton: botão universal de imagem (mesmo sistema do grid de combate) ---
// Pode ser usado em qualquer lugar do sistema: cenário, avatar, item, carta, etc.
const ImagePickerButton: React.FC<{
  value: string;
  onUpdate: (url: string) => void;
  label?: string;
  buttonLabel?: string;
  accentColor?: string;        // hex p/ personalizar cor do painel
  previewHeight?: number;
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showPreviewInline?: boolean;
  compact?: boolean;           // modo ícone (sem texto)
  icon?: React.ReactNode;
}> = ({ value, onUpdate, label, buttonLabel, accentColor, previewHeight = 60, placement = 'bottom-right', showPreviewInline = false, compact = false, icon }) => {
  const [open, setOpen] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const accent = accentColor || 'rgba(212,168,83,1)';
  const accentDim = accentColor ? `${accentColor}55` : 'rgba(212,168,83,0.25)';
  const accentFaint = accentColor ? `${accentColor}22` : 'rgba(212,168,83,0.12)';

  // close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const placementStyle: React.CSSProperties = (() => {
    switch (placement) {
      case 'bottom-left':  return { position:'absolute', top:34, left:0 };
      case 'top-right':    return { position:'absolute', bottom:34, right:0 };
      case 'top-left':     return { position:'absolute', bottom:34, left:0 };
      default:             return { position:'absolute', top:34, right:0 };
    }
  })();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('⚠️ Arquivo muito grande!\nUse imagens menores que 5MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { onUpdate(reader.result as string); setOpen(false); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div style={{ position:'relative', display:'inline-flex', flexDirection:'column', gap:6 }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title={label || 'Imagem'}
        style={{
          background: open ? `${accentFaint}` : 'rgba(22,27,38,0.9)',
          border: `1px solid ${value ? accentDim : 'rgba(212,168,83,0.2)'}`,
          borderRadius: 8, padding: compact ? '5px 7px' : '5px 10px',
          color: value ? accent : '#a07828', cursor:'pointer',
          display:'flex', alignItems:'center', gap:5,
          fontSize: compact ? 8 : 9, fontWeight:700,
          textTransform:'uppercase', letterSpacing:'0.1em',
          transition:'all 0.2s',
        }}
        className="hover:!bg-amber-900/40 hover:!text-amber-400"
      >
        {icon || <ImageIcon style={{width:10,height:10}}/>}
        {!compact && (buttonLabel || label || 'Imagem')} {value && !compact ? '●' : ''}
      </button>

      {/* Inline preview */}
      {showPreviewInline && value && (
        <div style={{ position:'relative', width:'100%' }}>
          <img src={value} alt="preview" style={{ width:'100%', height: previewHeight, objectFit:'cover', borderRadius:8, border:`1px solid ${accentDim}` }} />
          <button onClick={() => onUpdate('')} style={{ position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:'50%', background:'#dc2626', border:'2px solid #0f1117', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white', fontSize:9, fontWeight:900 }}>×</button>
        </div>
      )}

      {/* Dropdown panel */}
      {open && (
        <div ref={panelRef} style={{ ...placementStyle, zIndex:9999, background:'rgba(16,20,30,0.97)', border:`1px solid ${accentDim}`, borderRadius:12, padding:'12px', width:252, boxShadow:'0 12px 48px rgba(0,0,0,0.95)', backdropFilter:'blur(12px)' }}>
          <p style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.22em', color:'#7a5c14', marginBottom:8 }}>{label || 'Imagem'}</p>
          {value && (
            <div style={{ position:'relative', marginBottom:8 }}>
              <img src={value} alt="preview" style={{ width:'100%', height: previewHeight, objectFit:'cover', borderRadius:7, border:`1px solid ${accentDim}` }} />
              <button onClick={()=>{onUpdate('');}} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'#dc2626', border:'2px solid #0f1117', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white', fontSize:10, fontWeight:700 }}>×</button>
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <input
              type="text" placeholder="URL da imagem..." value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && urlInput.trim()) { onUpdate(urlInput.trim()); setOpen(false); setUrlInput(''); } }}
              style={{ border:`1px solid ${accentDim}`, borderRadius:7, padding:'6px 10px', fontSize:10, outline:'none', width:'100%' }}
            />
            {urlInput && (
              <button onClick={()=>{onUpdate(urlInput.trim());setOpen(false);setUrlInput('');}}
                style={{ padding:'5px', borderRadius:7, background:accentFaint, border:`1px solid ${accentDim}`, color: accent, fontSize:9, fontWeight:700, textTransform:'uppercase', cursor:'pointer' }}>
                ✓ Aplicar URL
              </button>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', background:accentFaint, border:`1px solid ${accentDim}`, borderRadius:7, color:accent, fontSize:9, fontWeight:700, textTransform:'uppercase', cursor:'pointer' }}
              className="hover:!bg-amber-900/40 hover:!text-amber-300"
            >
              <Upload style={{width:10,height:10}}/> Upload de Arquivo
            </button>
            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFile} />
          </div>
        </div>
      )}
    </div>
  );
};

// BgImageButton agora é um alias do ImagePickerButton para compatibilidade
const BgImageButton: React.FC<{ backgroundImage: string; onUpdate: (url: string) => void }> = ({ backgroundImage, onUpdate }) => (
  <ImagePickerButton value={backgroundImage} onUpdate={onUpdate} label="Cenário" buttonLabel={`Cenário${backgroundImage ? ' ●' : ''}`} />
);

// --- FieldConditionCreator: criar condições de campo livremente ---
const FieldConditionCreator: React.FC<{ onAdd: (name: string, duration: number) => void }> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(3);
  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), duration);
    setName('');
    setDuration(3);
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <div style={{ marginBottom:2 }}>
        <PresetConditionPicker onSelect={(n, d) => { setName(n); setDuration(d); }} />
      </div>
      <input
        type="text"
        placeholder="Nome da condição..."
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, padding:'5px 8px', fontSize:9, color:'#e8c878', outline:'none', width:'100%' }}
      />
      <div style={{ display:'flex', gap:5, alignItems:'center' }}>
        <input
          type="number"
          value={duration}
          min={1}
          onChange={e => setDuration(Math.max(1, Number(e.target.value)))}
          style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, padding:'5px 6px', fontSize:9, color:'#c9983a', outline:'none', width:50, textAlign:'center' }}
        />
        <span style={{ fontSize:8, color:'var(--text-faint)', flexShrink:0 }}>rodadas</span>
        <button onClick={handleAdd} style={{ marginLeft:'auto', padding:'4px 10px', borderRadius:7, fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', background:'rgba(120,90,20,0.3)', border:'1px solid rgba(201,152,58,0.3)', color:'#c9983a', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
          <Plus style={{width:8,height:8}}/> Add
        </button>
      </div>
    </div>
  );
};

// --- CustomPinCreator: criar e gerenciar pins customizados no grid ---
const PIN_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ec4899','#ffffff'];
const CustomPinCreator: React.FC<{
  onPlace: (label: string, color: string) => void;
  isPlacing: boolean;
  onCancel: () => void;
  pins: import('./types').CustomPin[];
  onRemove: (id: string) => void;
}> = ({ onPlace, isPlacing, onCancel, pins, onRemove }) => {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#ef4444');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <input
        type="text"
        placeholder="Rótulo do pin (opcional)..."
        value={label}
        onChange={e => setLabel(e.target.value)}
        style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, padding:'5px 8px', fontSize:9, color:'#e8c878', outline:'none', width:'100%' }}
      />
      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        {PIN_COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)} style={{ width:16, height:16, borderRadius:'50%', background:c, border: color===c ? '2px solid white' : '2px solid transparent', cursor:'pointer', flexShrink:0 }} title={c} />
        ))}
      </div>
      {isPlacing ? (
        <button onClick={onCancel} style={{ padding:'5px', borderRadius:7, fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.4)', color:'#f87171', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          <X style={{width:8,height:8}}/> Cancelar Posicionamento
        </button>
      ) : (
        <button onClick={() => onPlace(label, color)} style={{ padding:'5px', borderRadius:7, fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', background:`rgba(${color === '#ef4444' ? '239,68,68' : color === '#22c55e' ? '34,197,94' : '120,90,20'},0.2)`, border:`1px solid ${color}55`, color: color, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          <MapPin style={{width:8,height:8}}/> Colocar Pin no Grid
        </button>
      )}
      {pins.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:3, marginTop:2 }}>
          {pins.map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(0,0,0,0.3)', borderRadius:7, padding:'3px 7px', border:`1px solid ${p.color}33` }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0 }} />
              <span style={{ fontSize:8, fontWeight:700, color: p.color, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.label || '—'}</span>
              <span style={{ fontSize:7, color:'var(--text-faint)' }}>({p.gridPos.x},{p.gridPos.y})</span>
              <button onClick={() => onRemove(p.id)} style={{ color:'var(--text-faint)', padding:1, flexShrink:0 }} className="hover:text-rose-500"><Trash2 style={{width:8,height:8}}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- AddCombatantModal: proper component (fixes black screen from IIFE with useState) ---
const AddCombatantModal: React.FC<{
  characters: Character[];
  isCharInCombat: (id: string) => boolean;
  onSelect: (char: Character) => void;
  onClose: () => void;
  onNpcCode: (code: string) => void;
}> = ({ characters, isCharInCombat, onSelect, onClose, onNpcCode }) => {
  const [search, setSearch] = React.useState('');
  const [npcCode, setNpcCode] = React.useState('');

  // Only show Cast characters in the list
  const castChars = characters.filter(c => (c.role ?? 'npc') === 'cast');
  const filtered = castChars.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const inArena = filtered.filter(c => isCharInCombat(c.id));
  const available = filtered.filter(c => !isCharInCombat(c.id));

  // NPC characters for code lookup
  const npcChars = characters.filter(c => (c.role ?? 'npc') === 'npc');

  const handleNpcAdd = () => {
    const trimmed = npcCode.trim();
    if (!trimmed) return;
    // Find by code or by id prefix
    const found = npcChars.find(c =>
      (c.code && c.code.toLowerCase() === trimmed.toLowerCase()) ||
      c.id.toLowerCase().startsWith(trimmed.toLowerCase())
    );
    if (found) {
      onNpcCode(found.id);
    } else {
      alert(`Nenhum NPC encontrado com o código "${trimmed}"`);
    }
  };

  return (
    <Modal title="Preparar Arena — Adicionar Combatente" onClose={onClose}>
      <div className="space-y-6">
        {/* NPC code input */}
        <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/50 space-y-3">
          <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest flex items-center gap-2"><Users className="w-3 h-3" /> Adicionar NPC por Código</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Código do NPC (ex: BOSS01)..."
              value={npcCode}
              onChange={e => setNpcCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNpcAdd()}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-amber-600 outline-none placeholder-slate-600"
            />
            <button
              onClick={handleNpcAdd}
              className="px-5 py-3 bg-slate-700 hover:bg-amber-700 text-white font-extrabold uppercase text-xs tracking-widest rounded-xl border border-slate-600 hover:border-amber-500 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {npcChars.length > 0 && (
            <p className="text-[9px] text-slate-600">{npcChars.length} NPC(s) disponível(is): {npcChars.map(c => c.code ? `${c.name} (#${c.code})` : c.name).join(', ')}</p>
          )}
        </div>

        {/* Search Cast */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar personagem do Cast..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-11 pr-5 py-4 text-white font-bold focus:border-amber-600 outline-none placeholder-slate-600 text-sm"
            autoFocus
          />
        </div>

        {/* Available cast */}
        {available.length > 0 && (
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-2"><UserPlus className="w-3 h-3" /> Cast Disponível ({available.length})</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {available.map(char => (
                <div
                  key={char.id}
                  onClick={() => onSelect(char)}
                  className="p-4 rounded-[1.8rem] border-2 cursor-pointer transition-all flex items-center gap-4 bg-slate-900/50 border-slate-700 hover:border-amber-500 hover:bg-amber-950/20 group"
                  style={{ boxShadow: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(201,152,58,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  {char.icon
                    ? <img src={char.icon} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 group-hover:border-amber-500/50 transition-colors flex-shrink-0" />
                    : <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center flex-shrink-0"><Users className="w-6 h-6 text-slate-500" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold uppercase text-white italic truncate text-sm mb-1">{char.name}</h4>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-[9px] font-bold bg-rose-950/50 border border-rose-900/40 text-rose-400 px-2 py-0.5 rounded-full">❤ {char.maxHp} HP</span>
                      <span className="text-[9px] font-bold bg-amber-950/50 border border-amber-900/40 text-amber-400 px-2 py-0.5 rounded-full">⚡ {char.maxAura} Aura</span>
                      {(char.maxAmmo || 0) > 0 && <span className="text-[9px] font-bold bg-orange-950/50 border border-orange-900/40 text-orange-400 px-2 py-0.5 rounded-full">🎯 {char.maxAmmo}</span>}
                      <span className="text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">🃏 {char.cardIds.length}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center group-hover:bg-amber-600/40 transition-colors">
                      <Plus className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Already in combat */}
        {inArena.length > 0 && (
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-600 tracking-widest mb-3 flex items-center gap-2"><Swords className="w-3 h-3" /> Já na Arena ({inArena.length})</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {inArena.map(char => (
                <div key={char.id} className="p-3 rounded-2xl border border-amber-900/20 bg-amber-950/10 flex items-center gap-3 opacity-50">
                  {char.icon ? <img src={char.icon} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase text-amber-500/60 italic truncate">{char.name}</p>
                    <p className="text-[9px] text-amber-800 font-bold uppercase tracking-wider">Na arena</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && castChars.length === 0 && (
          <p className="text-slate-500 uppercase font-black text-center py-6 opacity-40">Nenhum personagem do Cast encontrado</p>
        )}
        {filtered.length === 0 && castChars.length > 0 && search && (
          <p className="text-slate-500 uppercase font-black text-center py-6 opacity-40">Nenhum resultado para "{search}"</p>
        )}
      </div>
    </Modal>
  );
};

// --- AssignCardModal: assign a card to a character ---
const AssignCardModal: React.FC<{
  card: Card;
  characters: Character[];
  onAssign: (charId: string, add: boolean) => void;
  onClose: () => void;
}> = ({ card, characters, onAssign, onClose }) => {
  const [search, setSearch] = React.useState('');
  const castChars = characters.filter(c => (c.role ?? 'npc') === 'cast');
  const filtered = castChars.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal title={`Atribuir "${card.name}" a Personagem`} onClose={onClose}>
      <div className="space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar personagem..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-11 pr-5 py-4 text-white font-bold focus:border-amber-600 outline-none placeholder-slate-600 text-sm"
            autoFocus
          />
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scroll">
          {filtered.map(char => {
            const hasCard = char.cardIds.includes(card.id);
            return (
              <div
                key={char.id}
                className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${hasCard ? 'bg-emerald-950/30 border-emerald-700/50' : 'bg-slate-900/50 border-slate-700'}`}
              >
                {char.icon
                  ? <img src={char.icon} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
                  : <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-slate-500" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold uppercase text-white italic text-sm truncate">{char.name}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{char.cardIds.length} habilidades</p>
                </div>
                <button
                  onClick={() => onAssign(char.id, !hasCard)}
                  className={`px-4 py-2 rounded-xl font-extrabold uppercase text-xs tracking-widest border transition-all ${hasCard ? 'bg-rose-900/40 border-rose-700/50 text-rose-400 hover:bg-rose-800/50' : 'bg-emerald-900/40 border-emerald-700/50 text-emerald-400 hover:bg-emerald-800/50'}`}
                >
                  {hasCard ? <><X className="w-3.5 h-3.5 inline mr-1" />Remover</> : <><Check className="w-3.5 h-3.5 inline mr-1" />Atribuir</>}
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-slate-500 uppercase font-black text-center py-8 opacity-40">Nenhum personagem do Cast encontrado</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

// --- CharacterCard component for the Characters tab ---
const CharacterCard: React.FC<{
  char: Character;
  idx: number;
  isCharInCombat: (id: string) => boolean;
  setEditingCharacter: (c: Character) => void;
  deleteCharacter: (id: string) => void;
  setSetupCombatant: (c: Character) => void;
}> = ({ char, idx, isCharInCombat, setEditingCharacter, deleteCharacter, setSetupCombatant }) => {
  const isNpc = (char.role ?? 'npc') === 'npc';
  return (
    <div
      className="group relative border-2 rounded-[2.5rem] p-6 bg-slate-900/50 hover:bg-slate-900 overflow-hidden anim-fade-up"
      style={{
        animationDelay: `${idx * 50}ms`,
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
        boxShadow: 'none',
        borderColor: isNpc ? 'rgba(71,85,105,0.6)' : 'rgba(71,63,20,0.6)',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = isNpc ? '0 0 25px rgba(100,116,139,0.1)' : '0 0 35px rgba(201,152,58,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: isNpc ? 'radial-gradient(ellipse at 50% 0%, rgba(100,116,139,0.05) 0%, transparent 70%)' : 'radial-gradient(ellipse at 50% 0%, rgba(180,140,40,0.1) 0%, transparent 70%)' }} />

      {/* Role badge */}
      <div className="absolute top-4 left-4">
        {isNpc
          ? <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-600 bg-slate-800/80 px-2 py-1 rounded-full border border-slate-700/50">NPC</span>
          : <span className="text-[8px] font-extrabold uppercase tracking-widest text-amber-500/80 bg-amber-950/60 px-2 py-1 rounded-full border border-amber-800/50">⭐ Cast</span>
        }
      </div>

      <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10">
        <button onClick={() => setEditingCharacter(char)} className="p-2 bg-slate-800/90 backdrop-blur text-slate-300 rounded-xl hover:bg-amber-600 hover:text-white border border-white/5">
          <Edit3 className="w-4 h-4" />
        </button>
        <button onClick={() => deleteCharacter(char.id)} className="p-2 bg-slate-800/90 backdrop-blur text-slate-300 rounded-xl hover:bg-rose-600 hover:text-white border border-white/5">
          <Trash2 className="w-4 h-4" />
        </button>
        <button onClick={() => setSetupCombatant(char)} className="p-2 bg-slate-800/90 backdrop-blur text-slate-300 rounded-xl hover:bg-emerald-600 hover:text-white border border-white/5" title="Adicionar ao Combate">
          <Swords className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center space-y-4 relative mt-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" style={{ background: isNpc ? 'rgba(100,116,139,0.3)' : 'rgba(201,152,58,0.4)', transform: 'scale(0.9)' }} />
          <img src={char.icon || undefined} className={`w-24 h-24 rounded-[2rem] object-cover border-2 transition-all duration-300 shadow-2xl bg-slate-900/80 relative z-10 group-hover:scale-[1.03] ${isNpc ? 'border-slate-700 group-hover:border-slate-500' : 'border-slate-700 group-hover:border-amber-500'}`} />
          {isCharInCombat(char.id) && (
            <div className="absolute -bottom-2 -right-2 bg-rose-600 text-white p-1.5 rounded-full border-2 border-slate-950 z-20 shadow-lg" title="Em Combate">
              <Swords className="w-3 h-3" />
            </div>
          )}
        </div>
        <div>
          <h3 className={`text-xl font-extrabold uppercase italic truncate max-w-[200px] transition-colors ${isNpc ? 'text-slate-300 group-hover:text-slate-100' : 'text-white group-hover:text-amber-200'}`}>{char.name}</h3>
          {char.code && (
            <p className="text-[9px] font-mono text-amber-500/70 mt-0.5 bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-900/30 inline-block">
              #{char.code}
            </p>
          )}
        </div>
        <div className="w-full bg-slate-900/80/60 rounded-2xl border border-slate-800/60 overflow-hidden">
          <div className={`grid ${char.maxAmmo > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="text-center p-3 border-r border-slate-800/60">
              <p className="text-[8px] text-slate-600 font-extrabold uppercase mb-1">❤ HP</p>
              <p className="text-lg font-black font-mono text-rose-400">{char.maxHp}</p>
            </div>
            <div className={`text-center p-3 ${char.maxAmmo > 0 ? 'border-r border-slate-800/60' : ''}`}>
              <p className="text-[8px] text-slate-600 font-extrabold uppercase mb-1">⚡ Aura</p>
              <p className="text-lg font-black font-mono text-amber-400">{char.maxAura}</p>
            </div>
            {char.maxAmmo > 0 && (
              <div className="text-center p-3">
                <p className="text-[8px] text-slate-600 font-extrabold uppercase mb-1">🎯 Mun.</p>
                <p className="text-lg font-black font-mono text-orange-400">{char.maxAmmo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stacks */}
        {(char.stacks || []).length > 0 && (
          <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:5 }}>
            {(char.stacks || []).map(stack => {
              const pct = stack.max > 0 ? Math.min(1, stack.current / stack.max) : 0;
              return (
                <div key={stack.id} style={{ width:'100%' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                    <span style={{ fontSize:8, fontWeight:700, color: stack.color, textTransform:'uppercase', letterSpacing:'0.1em' }}>{stack.name}</span>
                    <span style={{ fontSize:9, fontWeight:800, color: stack.color, fontFamily:"'JetBrains Mono',monospace" }}>{stack.current}/{stack.max}</span>
                  </div>
                  <div style={{ height:5, background:'rgba(0,0,0,0.5)', borderRadius:99, overflow:'hidden', border:`1px solid ${stack.color}33` }}>
                    <div style={{ height:'100%', width:`${pct*100}%`, background:stack.color, borderRadius:99, transition:'width 0.3s ease', boxShadow:`0 0 6px ${stack.color}88` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// --- CombatItemPanel: item selection panel for combat command ―――――――――――――――
const CombatItemPanel: React.FC<{
  actor: any;
  onUseItem: (item: any) => void;
}> = ({ actor, onUseItem }) => {
  const [search, setSearch] = React.useState('');
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const combatItems = (actor.items || []).filter((it: any) => it.usableInCombat && (it.quantity ?? 1) > 0);
  const filtered = combatItems.filter((it: any) => it.name.toLowerCase().includes(search.toLowerCase()));

  if (combatItems.length === 0) return (
    <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, opacity:0.2, height:150 }}>
      <PackageOpen style={{width:32,height:32,color:'#475569'}} />
      <p style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.3em'}}>Sem itens de combate</p>
    </div>
  );

  return (
    <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:0, animation:'cardDealIn 0.25s ease both' }}>
      {/* Search bar — same style as commandShowAll search */}
      <div style={{ width:'100%', maxWidth:480, padding:'0 16px 8px', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:7, background:'rgba(10,12,20,0.88)', border:'1px solid rgba(100,200,140,0.3)', borderRadius:10, padding:'6px 12px', backdropFilter:'blur(12px)' }}>
          <Search style={{ width:12, height:12, color:'rgba(100,220,140,0.5)', flexShrink:0 }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar itens..."
            autoFocus
            style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:11, fontWeight:600, color:'#a7f3d0', letterSpacing:'0.04em' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color:'rgba(100,220,140,0.4)', padding:0, lineHeight:1, flexShrink:0, background:'none', border:'none', cursor:'pointer' }}>
              <X style={{ width:10, height:10 }} />
            </button>
          )}
        </div>
        <span style={{ fontSize:9, color:'rgba(100,220,140,0.4)', fontWeight:700, letterSpacing:'0.1em', whiteSpace:'nowrap' }}>
          {filtered.length}/{combatItems.length}
        </span>
      </div>

      {/* Items scroll list — same command box appearance */}
      <div style={{
        width:'100%', maxWidth:480,
        maxHeight:210,
        overflowY:'auto',
        display:'flex', flexDirection:'column', gap:3,
        padding:'0 14px 8px',
        scrollbarWidth:'thin',
        scrollbarColor:'rgba(100,200,140,0.2) transparent',
      }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'24px 0', color:'rgba(100,220,140,0.25)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em' }}>
            Nenhum item encontrado
          </div>
        )}
        {filtered.map((item: any) => {
          const isHov = hoveredId === item.id;
          const qty = item.quantity ?? 1;
          const hasDice = !!item.combatDiceRoll;
          const hasHeal = (item.combatHeal ?? 0) > 0;
          const hasDmg = (item.combatDamage ?? 0) > 0;
          const hasAura = (item.combatAuraRecover ?? 0) > 0;
          const hasAmmo = (item.combatAmmoRecover ?? 0) > 0;
          const hasCond = !!item.combatConditionEffect;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onUseItem(item)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding: isHov ? '8px 10px' : '6px 10px',
                borderRadius:10,
                background: isHov
                  ? 'linear-gradient(90deg, rgba(20,50,30,0.95) 0%, rgba(15,40,25,0.9) 100%)'
                  : 'rgba(8,15,10,0.75)',
                border: isHov ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(100,200,140,0.12)',
                cursor:'pointer',
                transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: isHov ? '0 0 16px rgba(74,222,128,0.15), inset 0 1px 0 rgba(74,222,128,0.08)' : 'none',
              }}
              className="hover:brightness-110"
            >
              {/* Item image */}
              {item.image ? (
                <img src={item.image} style={{ width:36, height:36, borderRadius:7, objectFit:'cover', border:'1px solid rgba(74,222,128,0.25)', flexShrink:0 }} />
              ) : (
                <div style={{ width:36, height:36, borderRadius:7, background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>
                  🧪
                </div>
              )}

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                  <p style={{ fontSize:12, fontWeight:700, color: isHov ? '#a7f3d0' : '#6ee7b7', textTransform:'uppercase', letterSpacing:'0.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</p>
                  {item.consumeOnUse && (
                    <span style={{ fontSize:7, fontWeight:700, color:'rgba(248,113,113,0.7)', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:3, padding:'1px 4px', letterSpacing:'0.1em', flexShrink:0 }}>CONSUMÍVEL</span>
                  )}
                </div>
                {/* Stats badges */}
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {hasHeal && <span style={{ fontSize:8, fontWeight:700, color:'#86efac', background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:4, padding:'1px 5px' }}>💚+{item.combatHeal}</span>}
                  {hasDmg && <span style={{ fontSize:8, fontWeight:700, color:'#f87171', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:4, padding:'1px 5px' }}>⚔{item.combatDamage}</span>}
                  {hasDice && <span style={{ fontSize:8, fontWeight:700, color:'#fcd34d', background:'rgba(201,152,58,0.12)', border:'1px solid rgba(201,152,58,0.25)', borderRadius:4, padding:'1px 5px' }}>🎲{item.combatDiceRoll}</span>}
                  {hasAura && <span style={{ fontSize:8, fontWeight:700, color:'#67e8f9', background:'rgba(6,182,212,0.12)', border:'1px solid rgba(6,182,212,0.25)', borderRadius:4, padding:'1px 5px' }}>⚡+{item.combatAuraRecover}</span>}
                  {hasAmmo && <span style={{ fontSize:8, fontWeight:700, color:'#fdba74', background:'rgba(234,88,12,0.12)', border:'1px solid rgba(234,88,12,0.25)', borderRadius:4, padding:'1px 5px' }}>🎯+{item.combatAmmoRecover}</span>}
                  {(item.combatAmmoCost ?? 0) > 0 && <span style={{ fontSize:8, fontWeight:700, color:'#f97316', background:'rgba(249,115,22,0.12)', border:'1px solid rgba(249,115,22,0.35)', borderRadius:4, padding:'1px 5px' }}>🎯−{item.combatAmmoCost}</span>}
                  {item.combatTargeting && item.combatTargeting !== 'self' && <span style={{ fontSize:8, fontWeight:700, color:'#7dd3fc', background:'rgba(14,165,233,0.12)', border:'1px solid rgba(14,165,233,0.25)', borderRadius:4, padding:'1px 5px' }}>{item.combatTargeting==='other'?'👤 Alvo':item.combatTargeting==='area'?'💥 Área':'🎯 Escolher'}</span>}
                  {hasCond && <span style={{ fontSize:8, fontWeight:700, color:'#c4b5fd', background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:4, padding:'1px 5px' }}>✦{item.combatConditionEffect}</span>}
                  {item.combatDc && <span style={{ fontSize:8, fontWeight:700, color:'#94a3b8', background:'rgba(100,116,139,0.12)', border:'1px solid rgba(100,116,139,0.25)', borderRadius:4, padding:'1px 5px' }}>CD{item.combatDc}</span>}
                </div>
              </div>

              {/* Qty + use arrow */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 }}>
                <div style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:6, padding:'2px 7px', fontSize:10, fontWeight:700, color: qty <= 1 ? '#f87171' : '#86efac', fontFamily:"'JetBrains Mono',monospace" }}>
                  ×{qty}
                </div>
                <div style={{ fontSize:14, color: isHov ? '#4ade80' : 'rgba(74,222,128,0.3)', transition:'color 0.15s' }}>▶</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
//  SealForm Component
// ─────────────────────────────────────────────────────────────────
const SealForm: React.FC<{
  initialData?: Seal;
  characters: Character[];
  cards: Card[];
  onSubmit: (s: Seal) => void;
  onDelete: (id: string) => void;
}> = ({ initialData, characters, cards, onSubmit, onDelete }) => {
  const blank: Partial<Seal> = {
    name: '', code: '', image: '', description: '',
    diceRoll: '1d20', dc: 0, damage: 0, healHp: 0, healAura: 0,
    conditionEffect: '', conditionDuration: 3, duration: 0,
    executionMode: 'immediate', executionModes: ['immediate'], preparationRounds: 2,
    comboMinUsers: 2, comboMaxUsers: 4,
    damageModTarget: 'none', damageModValue: 0, damageModPercent: 0,
    cost: { hp: 0, aura: 0, ammo: 0 },
    requirements: [],
    symbol: '',
  };
  const [form, setForm] = React.useState<Partial<Seal>>({ ...blank, ...(initialData || {}) });
  const set = (p: Partial<Seal>) => setForm(prev => ({ ...prev, ...p }));
  const setCost = (p: Partial<any>) => setForm(prev => ({ ...prev, cost: { ...(prev.cost || {}), ...p } }));

  const addRequirement = () => {
    setForm(prev => ({ ...prev, requirements: [...(prev.requirements || []), { type: 'minHp', value: 50 }] }));
  };
  const removeRequirement = (i: number) => {
    setForm(prev => ({ ...prev, requirements: (prev.requirements || []).filter((_, idx) => idx !== i) }));
  };
  const updateRequirement = (i: number, p: any) => {
    setForm(prev => {
      const reqs = [...(prev.requirements || [])];
      reqs[i] = { ...reqs[i], ...p };
      return { ...prev, requirements: reqs };
    });
  };

  const INPUT = { background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'8px 12px', color:'white', fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' as const };
  const LBL = { fontSize:9, fontWeight:700, color:'rgba(251,146,60,0.7)', textTransform:'uppercase' as const, letterSpacing:'0.12em', display:'block' as const, marginBottom:4 };
  const SECT = { background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:'14px 16px' };
  const color = '#fb923c';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, maxHeight:'70vh', overflowY:'auto', paddingRight:4 }}>
      {/* ── Basic Info ── */}
      <div style={SECT}>
        <p style={{ fontSize:10, fontWeight:900, color, textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:12 }}>Identidade</p>
        <div style={{ display:'flex', gap:10, marginBottom:10 }}>
          <div style={{ flex:2 }}>
            <label style={LBL}>Nome</label>
            <input style={INPUT} value={form.name || ''} onChange={e => set({ name: e.target.value })} placeholder="Nome do Selo..." autoFocus />
          </div>
          <div style={{ flex:1 }}>
            <label style={LBL}>Código</label>
            <input style={{...INPUT, fontFamily:'monospace', fontWeight:700, letterSpacing:'0.1em'}}
              value={form.code || ''} onChange={e => set({ code: e.target.value.toUpperCase() })} placeholder="AUTO" />
          </div>
        </div>
        <div>
          <label style={LBL}>URL da Imagem</label>
          <input style={INPUT} value={form.image || ''} onChange={e => set({ image: e.target.value })} placeholder="https://..." />
        </div>
        {form.image && <img src={form.image} style={{ width:60, height:60, borderRadius:12, objectFit:'cover', border:'2px solid rgba(234,88,12,0.4)', marginTop:8 }} />}
        <div style={{ marginTop:10 }}>
          <label style={LBL}>Descrição</label>
          <textarea style={{...INPUT, resize:'none'}} rows={3} value={form.description || ''} onChange={e => set({ description: e.target.value })} placeholder="Descreva o poder deste selo..." />
        </div>
      </div>

      {/* ── Effect Stats ── */}
      <div style={SECT}>
        <p style={{ fontSize:10, fontWeight:900, color, textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:12 }}>Efeitos</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
          <div><label style={LBL}>Dado</label><input style={INPUT} value={form.diceRoll || ''} onChange={e => set({ diceRoll: e.target.value })} placeholder="1d20" /></div>
          <div><label style={LBL}>CD</label><input style={INPUT} type="number" min={0} value={form.dc ?? 0} onChange={e => set({ dc: +e.target.value })} /></div>
          <div><label style={LBL}>Duração (turnos)</label><input style={INPUT} type="number" min={0} value={form.duration ?? 0} onChange={e => set({ duration: +e.target.value })} /></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
          <div><label style={LBL}>Dano</label><input style={INPUT} type="number" min={0} value={form.damage ?? 0} onChange={e => set({ damage: +e.target.value })} /></div>
          <div><label style={LBL}>Cura HP</label><input style={INPUT} type="number" min={0} value={form.healHp ?? 0} onChange={e => set({ healHp: +e.target.value })} /></div>
          <div><label style={LBL}>Restaura Aura</label><input style={INPUT} type="number" min={0} value={form.healAura ?? 0} onChange={e => set({ healAura: +e.target.value })} /></div>
        </div>
        {(form.damage || 0) > 0 && (
          <div style={{ marginBottom:10 }}>
            <label style={LBL}>Tipo de Dano</label>
            <DamageTypeSelector small value={(form as any).damageType || 'normal'} onChange={v => set({ damageType: v } as any)} />
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <label style={LBL}>Condição</label>
            <div style={{ marginBottom:4 }}>
              <PresetConditionPicker onSelect={(name, dur) => set({ conditionEffect: name, conditionDuration: dur })} />
            </div>
            <input style={INPUT} value={form.conditionEffect || ''} onChange={e => set({ conditionEffect: e.target.value })} placeholder="ex: veneno" />
          </div>
          <div><label style={LBL}>Duração Condição</label><input style={INPUT} type="number" min={0} value={form.conditionDuration ?? 3} onChange={e => set({ conditionDuration: +e.target.value })} /></div>
        </div>
      </div>

      {/* ── Damage Modifier ── */}
      <div style={SECT}>
        <p style={{ fontSize:10, fontWeight:900, color:'#a5b4fc', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:12 }}>Modificador de Dano</p>
        <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' as const }}>
          {(['none','cardType','element'] as const).map(t => (
            <button key={t} onClick={() => set({ damageModTarget: t })} style={{
              padding:'6px 14px', borderRadius:8, fontSize:10, fontWeight:700, cursor:'pointer',
              background: form.damageModTarget === t ? 'rgba(139,92,246,0.3)' : 'rgba(0,0,0,0.3)',
              border: form.damageModTarget === t ? '1px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.06)',
              color: form.damageModTarget === t ? '#c4b5fd' : 'rgba(148,163,184,0.7)',
            }}>
              {t === 'none' ? 'Nenhum' : t === 'cardType' ? 'Por Tipo de Carta' : 'Por Elemento'}
            </button>
          ))}
        </div>
        {form.damageModTarget === 'cardType' && (
          <div style={{ marginBottom:10 }}>
            <label style={LBL}>Tipo de Carta</label>
            <select style={INPUT} value={form.damageModCardType || ''} onChange={e => set({ damageModCardType: e.target.value })}>
              <option value="">-- Selecione --</option>
              {['ataque','reação','ação','reforço','vínculo','combinação','forma'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        {form.damageModTarget === 'element' && (
          <div style={{ marginBottom:10 }}>
            <label style={LBL}>Elemento</label>
            <select style={INPUT} value={form.damageModElement || ''} onChange={e => set({ damageModElement: e.target.value })}>
              <option value="">-- Selecione --</option>
              {['fogo','água','terra','vento','raio'].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        )}
        {form.damageModTarget !== 'none' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label style={LBL}>Valor Fixo (±)</label><input style={INPUT} type="number" value={form.damageModValue ?? 0} onChange={e => set({ damageModValue: +e.target.value })} /></div>
            <div><label style={LBL}>Percentual (±%)</label><input style={INPUT} type="number" value={form.damageModPercent ?? 0} onChange={e => set({ damageModPercent: +e.target.value })} /></div>
          </div>
        )}
      </div>

      {/* ── Execution Mode (multi-select) ── */}
      <div style={SECT}>
        <p style={{ fontSize:10, fontWeight:900, color:'#67e8f9', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:12 }}>Modos de Execução <span style={{color:'#475569',fontWeight:500,fontSize:9}}>(múltiplos permitidos)</span></p>
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' as const }}>
          {([['immediate','⚡ Imediato'],['preparation','⏳ Preparação'],['combo','🤝 Combinação']] as [SealExecutionMode,string][]).map(([v, lbl]) => {
            const modes = form.executionModes || (form.executionMode ? [form.executionMode] : ['immediate']);
            const active = modes.includes(v);
            return (
              <button key={v} onClick={() => {
                const cur = form.executionModes || (form.executionMode ? [form.executionMode] : ['immediate']);
                const next = active ? cur.filter(m => m !== v) : [...cur, v];
                const final = next.length === 0 ? [v] : next;
                set({ executionModes: final, executionMode: final[0] });
              }} style={{
                padding:'7px 16px', borderRadius:8, fontSize:10, fontWeight:700, cursor:'pointer',
                background: active ? 'rgba(6,182,212,0.25)' : 'rgba(0,0,0,0.3)',
                border: active ? '1px solid rgba(6,182,212,0.5)' : '1px solid rgba(255,255,255,0.06)',
                color: active ? '#67e8f9' : 'rgba(148,163,184,0.7)',
              }}>{lbl}</button>
            );
          })}
        </div>
        {(form.executionModes || [form.executionMode]).includes('preparation') && (
          <div style={{ marginBottom:10 }}><label style={LBL}>Rodadas de Preparação</label><input style={INPUT} type="number" min={1} max={10} value={form.preparationRounds ?? 2} onChange={e => set({ preparationRounds: +e.target.value })} /></div>
        )}
        {(form.executionModes || [form.executionMode]).includes('combo') && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label style={LBL}>Mín. Participantes</label><input style={INPUT} type="number" min={2} value={form.comboMinUsers ?? 2} onChange={e => set({ comboMinUsers: +e.target.value })} /></div>
            <div><label style={LBL}>Máx. Participantes</label><input style={INPUT} type="number" min={2} value={form.comboMaxUsers ?? 4} onChange={e => set({ comboMaxUsers: +e.target.value })} /></div>
          </div>
        )}
      </div>

      {/* ── Symbol / Ritual ── */}
      <div style={SECT}>
        <p style={{ fontSize:10, fontWeight:900, color:'#fbbf24', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:12 }}>✦ Símbolo do Ritual</p>
        <p style={{ fontSize:9, color:'#475569', marginBottom:10, fontStyle:'italic' }}>Texto (ex: runa, emoji, kanji) ou URL de imagem — exibido em animação especial quando o selo for bem executado.</p>
        <div>
          <label style={LBL}>Símbolo (texto ou URL de imagem)</label>
          <input style={INPUT} value={form.symbol || ''} onChange={e => set({ symbol: e.target.value })} placeholder="Ex: ⚡ 🔯 火 ou https://..." />
        </div>
        {form.symbol && (
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:9, color:'#475569' }}>Preview:</span>
            {form.symbol.startsWith('http') || form.symbol.startsWith('data:')
              ? <img src={form.symbol} style={{ width:50, height:50, objectFit:'contain', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)' }} />
              : <span style={{ fontSize:36, filter:'drop-shadow(0 0 8px rgba(251,191,36,0.7))' }}>{form.symbol}</span>
            }
          </div>
        )}
      </div>

      {/* ── Costs ── */}
      <div style={SECT}>
        <p style={{ fontSize:10, fontWeight:900, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:12 }}>Custos de Ativação</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
          <div><label style={LBL}>HP</label><input style={INPUT} type="number" min={0} value={form.cost?.hp ?? 0} onChange={e => setCost({ hp: +e.target.value })} /></div>
          <div><label style={LBL}>Aura</label><input style={INPUT} type="number" min={0} value={form.cost?.aura ?? 0} onChange={e => setCost({ aura: +e.target.value })} /></div>
          <div><label style={LBL}>Munição</label><input style={INPUT} type="number" min={0} value={form.cost?.ammo ?? 0} onChange={e => setCost({ ammo: +e.target.value })} /></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div><label style={LBL}>Item necessário</label><input style={INPUT} value={form.cost?.itemName || ''} onChange={e => setCost({ itemName: e.target.value })} placeholder="Nome do item..." /></div>
          <div><label style={LBL}>Qtd. do Item</label><input style={INPUT} type="number" min={0} value={form.cost?.itemQuantity ?? 0} onChange={e => setCost({ itemQuantity: +e.target.value })} /></div>
        </div>
      </div>

      {/* ── Requirements ── */}
      <div style={SECT}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <p style={{ fontSize:10, fontWeight:900, color:'#a5b4fc', textTransform:'uppercase', letterSpacing:'0.2em' }}>Requisitos</p>
          <button onClick={addRequirement} style={{ padding:'4px 12px', borderRadius:8, fontSize:9, fontWeight:700, cursor:'pointer', background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.4)', color:'#a5b4fc' }}>+ Adicionar</button>
        </div>
        {(form.requirements || []).length === 0 && (
          <p style={{ fontSize:10, color:'rgba(148,163,184,0.4)', fontStyle:'italic', textAlign:'center', padding:'10px 0' }}>Nenhum requisito — qualquer personagem pode usar</p>
        )}
        {(form.requirements || []).map((req, i) => (
          <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8 }}>
            <div style={{ flex:1 }}>
              <select style={INPUT} value={req.type} onChange={e => updateRequirement(i, { type: e.target.value })}>
                <option value="specificCharacter">Personagem específico</option>
                <option value="linkedCard">Carta vinculada</option>
                <option value="itemCount">Qtd. de item</option>
                <option value="minHp">HP mínimo (%)</option>
                <option value="minAura">Aura mínima (%)</option>
                <option value="hasVinculo">Tem vínculo</option>
              </select>
              <div style={{ marginTop:6 }}>
                {req.type === 'specificCharacter' && (
                  <select style={INPUT} value={req.characterId || ''} onChange={e => updateRequirement(i, { characterId: e.target.value })}>
                    <option value="">-- Selecione --</option>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                {req.type === 'linkedCard' && (
                  <select style={INPUT} value={req.cardId || ''} onChange={e => updateRequirement(i, { cardId: e.target.value })}>
                    <option value="">-- Selecione --</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                {req.type === 'itemCount' && (
                  <div style={{ display:'flex', gap:6 }}>
                    <input style={{...INPUT, flex:2}} value={req.itemName || ''} onChange={e => updateRequirement(i, { itemName: e.target.value })} placeholder="Nome do item" />
                    <input style={{...INPUT, flex:1}} type="number" min={1} value={req.itemQuantity ?? 1} onChange={e => updateRequirement(i, { itemQuantity: +e.target.value })} />
                  </div>
                )}
                {(req.type === 'minHp' || req.type === 'minAura') && (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input style={{...INPUT, flex:1}} type="number" min={0} max={100} value={req.value ?? 50} onChange={e => updateRequirement(i, { value: +e.target.value })} />
                    <span style={{ fontSize:10, color:'#64748b', whiteSpace:'nowrap' }}>%</span>
                  </div>
                )}
                {req.type === 'hasVinculo' && (
                  <input
                    style={INPUT}
                    value={req.vinculoName || ''}
                    onChange={e => updateRequirement(i, { vinculoName: e.target.value })}
                    placeholder="Nome exato do vínculo (ex: Pacto de Sangue)"
                  />
                )}
              </div>
            </div>
            <button onClick={() => removeRequirement(i)} style={{ padding:'6px 8px', borderRadius:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', cursor:'pointer', marginTop:2 }}>
              <Trash2 style={{ width:12, height:12 }} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Actions ── */}
      <div style={{ display:'flex', gap:10 }}>
        {initialData?.id && (
          <button onClick={() => onDelete(initialData.id)} style={{ padding:'10px 20px', borderRadius:12, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:10, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Excluir
          </button>
        )}
        <button onClick={() => form.name?.trim() && onSubmit(form as Seal)} disabled={!form.name?.trim()} style={{
          flex:1, padding:'10px', borderRadius:12, fontSize:11, fontWeight:900, cursor: form.name?.trim() ? 'pointer' : 'not-allowed',
          background: form.name?.trim() ? 'linear-gradient(135deg,rgba(234,88,12,0.7),rgba(249,115,22,0.8))' : 'rgba(20,15,10,0.5)',
          border: form.name?.trim() ? '1.5px solid rgba(234,88,12,0.6)' : '1px solid rgba(234,88,12,0.1)',
          color: form.name?.trim() ? 'white' : 'rgba(148,130,110,0.3)', textTransform:'uppercase', letterSpacing:'0.15em',
          boxShadow: form.name?.trim() ? '0 0 20px rgba(234,88,12,0.25)' : 'none',
        }}>
          {initialData?.id ? 'Salvar Alterações' : '✦ Criar Selo'}
        </button>
      </div>
    </div>
  );
};

// --- Seal Ritual Overlay ---
const SealRitualOverlay: React.FC<{
  seal: Seal;
  effects: string[];
  onDone: () => void;
}> = ({ seal, effects, onDone }) => {
  const isImageSymbol = seal.symbol && (seal.symbol.startsWith('http') || seal.symbol.startsWith('data:'));
  React.useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, []);

  return createPortal(
    <div style={{
      position:'fixed', inset:0, zIndex:999999,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      background:'radial-gradient(ellipse at 50% 50%, rgba(120,60,0,0.35) 0%, rgba(5,3,12,0.97) 100%)',
      backdropFilter:'blur(20px)',
      animation:'ritual-bg-in 0.5s ease forwards',
    }} onClick={onDone}>
      <style>{`
        @keyframes ritual-bg-in { from { opacity:0 } to { opacity:1 } }
        @keyframes ritual-symbol-in {
          0% { transform:scale(0.2) rotate(-20deg); opacity:0; filter:blur(30px) brightness(3); }
          40% { transform:scale(1.15) rotate(4deg); opacity:1; filter:blur(0) brightness(1.5); }
          70% { transform:scale(0.95) rotate(-2deg); }
          100% { transform:scale(1) rotate(0deg); opacity:1; filter:brightness(1.2); }
        }
        @keyframes ritual-ring-1 {
          0% { transform:scale(0) rotate(0deg); opacity:0; }
          30% { opacity:1; }
          100% { transform:scale(3.5) rotate(180deg); opacity:0; }
        }
        @keyframes ritual-ring-2 {
          0% { transform:scale(0) rotate(0deg); opacity:0; }
          20% { opacity:0; }
          50% { opacity:0.8; }
          100% { transform:scale(4.5) rotate(-120deg); opacity:0; }
        }
        @keyframes ritual-glow-pulse {
          0%,100% { box-shadow: 0 0 40px 10px rgba(251,146,60,0.4), 0 0 80px 20px rgba(234,88,12,0.2); }
          50% { box-shadow: 0 0 80px 30px rgba(251,191,36,0.7), 0 0 150px 50px rgba(234,88,12,0.4); }
        }
        @keyframes ritual-particle {
          0% { transform:translateY(0) scale(1); opacity:1; }
          100% { transform:translateY(-120px) scale(0); opacity:0; }
        }
        @keyframes ritual-text-in {
          0% { transform:translateY(30px); opacity:0; }
          100% { transform:translateY(0); opacity:1; }
        }
        @keyframes ritual-effect-in {
          0% { transform:translateX(-20px); opacity:0; }
          100% { transform:translateX(0); opacity:1; }
        }
      `}</style>

      {/* Outer rings */}
      <div style={{
        position:'absolute', width:300, height:300, borderRadius:'50%',
        border:'2px solid rgba(251,146,60,0.6)',
        animation:'ritual-ring-1 3s ease-out forwards',
      }} />
      <div style={{
        position:'absolute', width:300, height:300, borderRadius:'50%',
        border:'1px solid rgba(251,191,36,0.4)',
        animation:'ritual-ring-2 3.5s ease-out 0.3s forwards',
      }} />

      {/* Particles */}
      {Array.from({length:12}).map((_,i) => (
        <div key={i} style={{
          position:'absolute',
          width: 4+Math.random()*6, height: 4+Math.random()*6,
          borderRadius:'50%',
          background:'rgba(251,191,36,0.8)',
          left:`calc(50% + ${Math.cos(i/12*Math.PI*2)*100}px)`,
          top:`calc(50% + ${Math.sin(i/12*Math.PI*2)*100}px)`,
          animation:`ritual-particle ${1.5+Math.random()}s ease-out ${0.3+i*0.1}s forwards`,
        }} />
      ))}

      {/* Main symbol */}
      <div style={{
        animation:'ritual-symbol-in 1s cubic-bezier(0.34,1.56,0.64,1) forwards',
        marginBottom:32,
      }}>
        {isImageSymbol ? (
          <img src={seal.symbol} style={{
            width:200, height:200, objectFit:'contain', borderRadius:24,
            filter:'drop-shadow(0 0 40px rgba(251,146,60,0.9)) drop-shadow(0 0 20px rgba(251,191,36,0.7))',
            animation:'ritual-glow-pulse 1.5s ease-in-out infinite',
          }} />
        ) : seal.symbol ? (
          <div style={{
            fontSize:160, lineHeight:1,
            filter:'drop-shadow(0 0 40px rgba(251,146,60,0.9)) drop-shadow(0 0 20px rgba(251,191,36,0.7))',
            animation:'ritual-glow-pulse 1.5s ease-in-out infinite',
          }}>{seal.symbol}</div>
        ) : (
          <div style={{
            fontSize:120, lineHeight:1,
            filter:'drop-shadow(0 0 40px rgba(251,146,60,0.9))',
          }}>🔯</div>
        )}
      </div>

      {/* Seal name */}
      <div style={{
        animation:'ritual-text-in 0.6s ease 0.8s both',
        textAlign:'center', marginBottom:16,
      }}>
        <h2 style={{
          fontSize:36, fontWeight:900, textTransform:'uppercase', fontStyle:'italic', letterSpacing:'0.15em',
          background:'linear-gradient(135deg,#fb923c,#fbbf24,#fb923c)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          textShadow:'none',
        }}>{seal.name}</h2>
        <p style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.3em', marginTop:4 }}>Selo Ativado</p>
      </div>

      {/* Effects list */}
      {effects.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center', maxWidth:400 }}>
          {effects.map((e,i) => (
            <div key={i} style={{
              padding:'8px 20px', borderRadius:12,
              background:'rgba(0,0,0,0.5)', border:'1px solid rgba(251,146,60,0.3)',
              fontSize:13, color:'#fbbf24', fontWeight:700,
              animation:`ritual-effect-in 0.4s ease ${1.2 + i*0.15}s both`,
            }}>{e}</div>
          ))}
        </div>
      )}

      <p style={{ position:'absolute', bottom:40, fontSize:10, color:'rgba(148,163,184,0.4)', textTransform:'uppercase', letterSpacing:'0.2em' }}>
        Toque para fechar
      </p>
    </div>,
    document.body
  );
};

// --- Item Use Animation ---
const ItemUseAnimation: React.FC<{
  item: Item;
  onDone: () => void;
}> = ({ item, onDone }) => {
  React.useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, []);

  const cat = (item.category || '').toLowerCase();
  const isWeapon = cat.includes('arma') || cat === 'weapon';
  const isConsumable = cat.includes('consumí') || cat.includes('consumiv') || cat === 'potion' || cat === 'food';
  const isArmor = cat.includes('armadu');

  const getAnim = () => {
    if (isWeapon) return { emoji:'⚔️', color:'#ef4444', glow:'rgba(239,68,68,0.8)', anim:'weapon-slash' };
    if (isConsumable) return { emoji:'✨', color:'#4ade80', glow:'rgba(74,222,128,0.8)', anim:'consumable-sparkle' };
    if (isArmor) return { emoji:'🛡️', color:'#60a5fa', glow:'rgba(96,165,250,0.8)', anim:'armor-shield' };
    return { emoji:'🌟', color:'#fbbf24', glow:'rgba(251,191,36,0.8)', anim:'item-use' };
  };
  const { emoji, color, glow, anim } = getAnim();

  return createPortal(
    <div style={{
      position:'fixed', inset:0, zIndex:999998,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(5,3,12,0.65)', backdropFilter:'blur(8px)',
      animation:'item-overlay-in 0.3s ease forwards',
      pointerEvents:'none',
    }}>
      <style>{`
        @keyframes item-overlay-in { from{opacity:0} to{opacity:1} }
        @keyframes weapon-slash {
          0% { transform:translateY(60px) rotate(-45deg) scale(0.5); opacity:0; }
          30% { transform:translateY(-10px) rotate(15deg) scale(1.3); opacity:1; }
          60% { transform:translateY(0) rotate(-5deg) scale(1.0); }
          80% { transform:scale(1.1) rotate(0deg); }
          100% { transform:scale(0.8) translateY(-30px); opacity:0; }
        }
        @keyframes consumable-sparkle {
          0% { transform:scale(0.2); opacity:0; filter:blur(10px); }
          40% { transform:scale(1.4); opacity:1; filter:blur(0); }
          70% { transform:scale(0.9); }
          100% { transform:scale(1.2) translateY(-20px); opacity:0; }
        }
        @keyframes armor-shield {
          0% { transform:scale(0.3) translateY(40px); opacity:0; }
          50% { transform:scale(1.15) translateY(-5px); opacity:1; }
          80% { transform:scale(1) translateY(0); }
          100% { transform:scale(0.7) translateY(-40px); opacity:0; }
        }
        @keyframes item-use {
          0% { transform:scale(0) rotate(-30deg); opacity:0; }
          50% { transform:scale(1.2) rotate(10deg); opacity:1; }
          100% { transform:scale(0.8) translateY(-30px); opacity:0; }
        }
        @keyframes item-ring-out {
          0% { transform:scale(0.5); opacity:0.8; }
          100% { transform:scale(2.5); opacity:0; }
        }
        @keyframes item-name-in {
          0% { transform:translateY(20px); opacity:0; }
          30% { opacity:1; transform:translateY(0); }
          80% { opacity:1; }
          100% { opacity:0; transform:translateY(-10px); }
        }
      `}</style>
      <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        {/* Ring */}
        <div style={{
          position:'absolute', width:160, height:160, borderRadius:'50%',
          border:`2px solid ${color}`,
          animation:'item-ring-out 1.5s ease-out 0.2s forwards',
          opacity:0,
        }} />
        {/* Main icon */}
        <div style={{
          fontSize:100, lineHeight:1,
          filter:`drop-shadow(0 0 30px ${glow}) drop-shadow(0 0 15px ${glow})`,
          animation:`${anim} 2s cubic-bezier(0.34,1.56,0.64,1) forwards`,
        }}>
          {item.image && !item.image.startsWith('data:') ? (
            <img src={item.image} style={{ width:100, height:100, objectFit:'contain', borderRadius:16, filter:`drop-shadow(0 0 20px ${glow})` }} />
          ) : emoji}
        </div>
        {/* Item name */}
        <div style={{
          padding:'8px 24px', borderRadius:999,
          background:'rgba(0,0,0,0.7)', border:`1px solid ${color}40`,
          fontSize:14, fontWeight:700, color:'white', textTransform:'uppercase', letterSpacing:'0.15em',
          animation:'item-name-in 2.5s ease forwards',
          opacity:0,
        }}>{item.name}</div>
      </div>
    </div>,
    document.body
  );
};

// --- NPC Wildcard Modal ---
const NpcWildcardModal: React.FC<{
  actor: any;
  command: string;
  cards: Card[];
  onCreated: (card: Partial<Card>) => void;
  onClose: () => void;
}> = ({ actor, command, onCreated, onClose }) => {
  const commandInfo: Record<string, {type: string, color: string, label: string}> = {
    'ataque':  { type: 'ataque',  color: '#ef4444', label: 'Ataque' },
    'vínculo': { type: 'vínculo', color: '#94a3b8', label: 'Vínculo' },
    'item':    { type: 'ação',    color: '#22c55e', label: 'Item/Ação' },
    'foco':    { type: 'ação',    color: '#67e8f9', label: 'Foco' },
  };
  const info = commandInfo[command] || commandInfo['ataque'];
  const [form, setForm] = React.useState<Partial<Card>>({
    name: '',
    type: info.type as any,
    auraCost: 0,
    diceRoll: '1d20',
    damage: 0,
    description: '',
    image: '',
    dc: undefined,
    conditionEffect: '',
    conditionDuration: 3,
  });
  const set = (p: Partial<Card>) => setForm(prev => ({ ...prev, ...p }));

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:99998,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(5,3,12,0.92)', backdropFilter:'blur(16px)',
    }}>
      <div style={{
        position:'relative', zIndex:1, width:'100%', maxWidth:440, margin:'0 auto',
        background:'linear-gradient(160deg,rgba(12,8,22,0.99),rgba(8,5,18,0.99))',
        border:`2px solid ${info.color}55`,
        borderRadius:22, padding:24,
        boxShadow:`0 0 50px ${info.color}22, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontSize:12, fontWeight:900, color:info.color, textTransform:'uppercase', letterSpacing:'0.2em' }}>
            ✦ Nova Habilidade NPC — {info.label}
          </div>
          <div style={{ fontSize:9, color:'rgba(200,200,220,0.4)', letterSpacing:'0.08em' }}>{actor.name}</div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div>
            <label style={{ fontSize:9, fontWeight:700, color:`${info.color}99`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>Nome</label>
            <input type="text" value={form.name || ''} onChange={e => set({ name: e.target.value })} placeholder="Nome da habilidade..."
              autoFocus
              style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${info.color}44`, borderRadius:10, padding:'9px 12px', color:'white', fontSize:13, fontWeight:700, outline:'none', boxSizing:'border-box' }}
            />
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:9, fontWeight:700, color:`${info.color}99`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>Dado</label>
              <input type="text" value={form.diceRoll || ''} onChange={e => set({ diceRoll: e.target.value })} placeholder="1d20"
                style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${info.color}44`, borderRadius:10, padding:'8px 10px', color:'white', fontSize:12, fontWeight:700, outline:'none', textAlign:'center', boxSizing:'border-box' }}
              />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:9, fontWeight:700, color:`${info.color}99`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>Dano</label>
              <input type="number" min={0} value={form.damage ?? 0} onChange={e => set({ damage: Number(e.target.value) })}
                style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${info.color}44`, borderRadius:10, padding:'8px 10px', color:'white', fontSize:12, fontWeight:700, outline:'none', textAlign:'center', boxSizing:'border-box' }}
              />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:9, fontWeight:700, color:`${info.color}99`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>CD</label>
              <input type="number" min={0} value={form.dc ?? ''} onChange={e => set({ dc: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="—"
                style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${info.color}44`, borderRadius:10, padding:'8px 10px', color:'white', fontSize:12, fontWeight:700, outline:'none', textAlign:'center', boxSizing:'border-box' }}
              />
            </div>
          </div>
          {(form.damage || 0) > 0 && (
            <div>
              <label style={{ fontSize:9, fontWeight:700, color:`${info.color}99`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>Tipo de Dano</label>
              <DamageTypeSelector small value={(form as any).damageType || 'normal'} onChange={v => set({ damageType: v } as any)} />
            </div>
          )}

          <div>
            <label style={{ fontSize:9, fontWeight:700, color:`${info.color}99`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>Descrição (opcional)</label>
            <textarea value={form.description || ''} onChange={e => set({ description: e.target.value })} rows={2} placeholder="Descreva o efeito..."
              style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${info.color}44`, borderRadius:10, padding:'8px 12px', color:'white', fontSize:11, outline:'none', resize:'none', boxSizing:'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize:9, fontWeight:700, color:`${info.color}99`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>URL de Imagem (opcional)</label>
            <input type="text" value={form.image || ''} onChange={e => set({ image: e.target.value })} placeholder="https://..."
              style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${info.color}44`, borderRadius:10, padding:'8px 12px', color:'white', fontSize:11, outline:'none', boxSizing:'border-box' }}
            />
          </div>

          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button onClick={onClose}
              style={{ flex:1, padding:'9px', borderRadius:10, background:'rgba(30,12,12,0.9)', border:'1px solid rgba(220,38,38,0.3)', color:'#f87171', fontSize:10, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.1em' }}>
              ✕ Cancelar
            </button>
            <button onClick={() => form.name?.trim() && onCreated(form)} disabled={!form.name?.trim()}
              style={{
                flex:2, padding:'9px', borderRadius:10, fontSize:11, fontWeight:900,
                cursor: form.name?.trim() ? 'pointer' : 'not-allowed',
                background: form.name?.trim() ? `linear-gradient(135deg,${info.color}44,${info.color}66)` : 'rgba(20,15,30,0.5)',
                border: form.name?.trim() ? `1.5px solid ${info.color}88` : `1px solid ${info.color}22`,
                color: form.name?.trim() ? 'white' : 'rgba(150,140,160,0.3)',
                textTransform:'uppercase', letterSpacing:'0.15em',
              }}>
              ✦ Criar e Usar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- NPC Special Card Modal (Contra-Ataque / Armadura) ---
const NpcSpecialCardModal: React.FC<{
  actor: any;
  cardType: 'contra-ataque' | 'armadura';
  onUse: (card: Partial<Card>) => void;
  onClose: () => void;
}> = ({ actor, cardType, onUse, onClose }) => {
  const isContra = cardType === 'contra-ataque';
  const color = isContra ? '#ef4444' : '#22c55e';
  const label = isContra ? 'Contra-Ataque' : 'Armadura';
  const defaultCard: Partial<Card> = isContra
    ? { name: 'Contra-Ataque', type: 'reação', auraCost: 0, diceRoll: '1d20', damage: 5, dc: 12,
        description: 'Reage ao ataque do adversário causando dano de retorno', image: '' }
    : { name: 'Armadura', type: 'reforço', auraCost: 0, diceRoll: '1d20', damage: 0, dc: undefined,
        description: 'Cria uma camada protetora que concede HP extra', image: '',
        bonuses: [{ type: 'healHp' as any, value: 10, duration: 0 }] };

  const [form, setForm] = React.useState<Partial<Card>>(defaultCard);
  const set = (p: Partial<Card>) => setForm(prev => ({ ...prev, ...p }));

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:99998,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(5,3,12,0.92)', backdropFilter:'blur(16px)',
    }}>
      <div style={{
        position:'relative', zIndex:1, width:'100%', maxWidth:400, margin:'0 auto',
        background:'linear-gradient(160deg,rgba(12,8,22,0.99),rgba(8,5,18,0.99))',
        border:`2px solid ${color}55`,
        borderRadius:22, padding:24,
        boxShadow:`0 0 50px ${color}22, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontSize:12, fontWeight:900, color, textTransform:'uppercase', letterSpacing:'0.2em' }}>
            {isContra ? '⚔ ' : '🛡 '}{label}
          </div>
          <div style={{ fontSize:9, color:'rgba(200,200,220,0.4)', letterSpacing:'0.08em' }}>{actor.name}</div>
        </div>
        <div style={{ fontSize:9, color:`${color}88`, letterSpacing:'0.08em', marginBottom:14, fontStyle:'italic' }}>
          {isContra ? 'Carta de Reação especial — causa dano ao atacante' : 'Carta de Reforço especial — concede HP ao usuário'}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:9, fontWeight:700, color:`${color}88`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>Dado</label>
              <input type="text" value={form.diceRoll || ''} onChange={e => set({ diceRoll: e.target.value })}
                style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${color}44`, borderRadius:10, padding:'8px 10px', color:'white', fontSize:12, fontWeight:700, outline:'none', textAlign:'center', boxSizing:'border-box' }}
              />
            </div>
            {isContra ? (
              <div style={{ flex:1 }}>
                <label style={{ fontSize:9, fontWeight:700, color:`${color}88`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>Dano</label>
                <input type="number" min={0} value={form.damage ?? 0} onChange={e => set({ damage: Number(e.target.value) })}
                  style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${color}44`, borderRadius:10, padding:'8px 10px', color:'white', fontSize:12, fontWeight:700, outline:'none', textAlign:'center', boxSizing:'border-box' }}
                />
              </div>
            ) : (
              <div style={{ flex:1 }}>
                <label style={{ fontSize:9, fontWeight:700, color:`${color}88`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>HP Concedido</label>
                <input type="number" min={1} value={((form as any).bonuses?.[0]?.value ?? 10)} onChange={e => { const v = Number(e.target.value); set({ bonuses: [{ type: 'healHp' as any, value: v, duration: 0 }], description: `Armadura: +${v} HP` }); }}
                  style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${color}44`, borderRadius:10, padding:'8px 10px', color:'white', fontSize:12, fontWeight:700, outline:'none', textAlign:'center', boxSizing:'border-box' }}
                />
              </div>
            )}
            <div style={{ flex:1 }}>
              <label style={{ fontSize:9, fontWeight:700, color:`${color}88`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>CD</label>
              <input type="number" min={0} value={form.dc ?? ''} onChange={e => set({ dc: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="—"
                style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${color}44`, borderRadius:10, padding:'8px 10px', color:'white', fontSize:12, fontWeight:700, outline:'none', textAlign:'center', boxSizing:'border-box' }}
              />
            </div>
          </div>
          {isContra && (form.damage || 0) > 0 && (
            <div>
              <label style={{ fontSize:9, fontWeight:700, color:`${color}88`, textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:4 }}>Tipo de Dano</label>
              <DamageTypeSelector small value={(form as any).damageType || 'normal'} onChange={v => set({ damageType: v } as any)} />
            </div>
          )}

          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button onClick={onClose}
              style={{ flex:1, padding:'9px', borderRadius:10, background:'rgba(30,12,12,0.9)', border:'1px solid rgba(220,38,38,0.3)', color:'#f87171', fontSize:10, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.1em' }}>
              ✕ Cancelar
            </button>
            <button onClick={() => onUse(form)}
              style={{
                flex:2, padding:'9px', borderRadius:10, fontSize:11, fontWeight:900, cursor:'pointer',
                background:`linear-gradient(135deg,${color}44,${color}66)`,
                border:`1.5px solid ${color}88`,
                color:'white', textTransform:'uppercase', letterSpacing:'0.15em',
                boxShadow:`0 0 16px ${color}33`,
              }}>
              ✦ {isContra ? 'Usar Contra-Ataque' : 'Ativar Armadura'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
//  SealComboModal — select participants for combo seal execution
// ─────────────────────────────────────────────────────────────────
const SealComboModal: React.FC<{
  seal: Seal;
  actor: any;
  combatants: any[];
  onExecute: (participantIds: string[]) => void;
  onClose: () => void;
}> = ({ seal, actor, combatants, onExecute, onClose }) => {
  const min = seal.comboMinUsers ?? 2;
  const max = seal.comboMaxUsers ?? 4;
  const [selected, setSelected] = React.useState<string[]>([actor.combatId]);

  const toggle = (id: string) => {
    if (id === actor.combatId) return; // initiator always selected
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < max ? [...prev, id] : prev);
  };

  const canExecute = selected.length >= min;
  const C = '#fb923c';

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99998, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(5,3,12,0.95)', backdropFilter:'blur(16px)' }}>
      <div style={{ width:'100%', maxWidth:420, background:'linear-gradient(160deg,rgba(12,8,22,0.99),rgba(8,5,18,0.99))', border:`2px solid rgba(234,88,12,0.45)`, borderRadius:22, padding:24, boxShadow:`0 0 60px rgba(234,88,12,0.2)` }}>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:900, color:C, textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:4 }}>🔯 Selo de Combinação</div>
          <div style={{ fontSize:11, fontWeight:700, color:'white', marginBottom:2 }}>{seal.name}</div>
          <div style={{ fontSize:9, color:'rgba(148,163,184,0.6)', fontStyle:'italic' }}>Selecione {min}–{max} participantes para ativar</div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:260, overflowY:'auto', marginBottom:16 }}>
          {combatants.map(c => {
            const isSelf = c.combatId === actor.combatId;
            const isSel = selected.includes(c.combatId);
            return (
              <div key={c.combatId} onClick={() => toggle(c.combatId)} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:12, cursor: isSelf ? 'default' : 'pointer',
                background: isSel ? 'rgba(234,88,12,0.15)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${isSel ? 'rgba(234,88,12,0.5)' : 'rgba(255,255,255,0.06)'}`,
                transition:'all 0.15s',
              }}>
                <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${isSel ? C : 'rgba(255,255,255,0.15)'}`, background: isSel ? `rgba(234,88,12,0.3)` : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {isSel && <span style={{ fontSize:11, color:C }}>✓</span>}
                </div>
                <div style={{ width:30, height:30, borderRadius:8, overflow:'hidden', flexShrink:0 }}>
                  {c.icon ? <img src={c.icon} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>👤</div>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color: isSel ? 'white' : 'rgba(255,255,255,0.7)' }}>{c.name}{isSelf ? ' (você)' : ''}</div>
                  <div style={{ fontSize:8, color:'rgba(148,163,184,0.5)' }}>HP {c.currentHp}/{c.maxHp}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize:9, color:'rgba(148,163,184,0.4)', textAlign:'center', marginBottom:12 }}>
          {selected.length}/{max} selecionados {canExecute ? '✓ Pronto!' : `(mín. ${min})`}
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'9px', borderRadius:10, background:'rgba(30,12,12,0.9)', border:'1px solid rgba(220,38,38,0.3)', color:'#f87171', fontSize:10, fontWeight:700, cursor:'pointer', textTransform:'uppercase' }}>✕ Cancelar</button>
          <button onClick={() => canExecute && onExecute(selected)} disabled={!canExecute} style={{
            flex:2, padding:'9px', borderRadius:10, fontSize:11, fontWeight:900, cursor: canExecute ? 'pointer' : 'not-allowed',
            background: canExecute ? `linear-gradient(135deg,rgba(234,88,12,0.7),rgba(249,115,22,0.8))` : 'rgba(20,15,10,0.5)',
            border: canExecute ? `1.5px solid rgba(234,88,12,0.6)` : `1px solid rgba(234,88,12,0.1)`,
            color: canExecute ? 'white' : 'rgba(148,130,110,0.3)', textTransform:'uppercase', letterSpacing:'0.1em',
          }}>
            🔯 Ativar Selo
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
//  SealCommandPanel — combat command panel for seals
// ─────────────────────────────────────────────────────────────────
const SealCommandPanel: React.FC<{
  actor: any;
  seals: Seal[];
  characters: Character[];
  onExecuteSeal: (seal: Seal) => void;
  onCancel: () => void;
}> = ({ actor, seals, characters, onExecuteSeal, onCancel }) => {
  const [code, setCode] = React.useState('');
  const [found, setFound] = React.useState<Seal | null>(null);
  const [error, setError] = React.useState('');
  const [hovIdx, setHovIdx] = React.useState<number | null>(null);

  const lookupSeal = (v: string) => {
    setCode(v.toUpperCase());
    setError('');
    if (v.length >= 3) {
      const match = seals.find(s => s.code?.toUpperCase() === v.toUpperCase());
      setFound(match || null);
      if (v.length >= 4 && !match) setError('Código inválido ou selo não encontrado');
    } else {
      setFound(null);
    }
  };

  // Quick-access: recently accessible seals (visible, non-hidden)
  const visibleSeals = seals.filter(s => !s.isHidden);

  const C = '#fb923c';
  const CARD_W = 100;
  const CARD_H = 140;

  return (
    <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:12, padding:'0 4px 8px', animation:'cardDealIn 0.25s ease both' }}>
      {/* Code Input */}
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <div style={{ flex:1, position:'relative' }}>
          <input
            autoFocus
            type="text"
            value={code}
            onChange={e => lookupSeal(e.target.value)}
            placeholder="Digite o código do Selo..."
            maxLength={12}
            style={{
              width:'100%', padding:'10px 40px 10px 14px', borderRadius:12,
              background:'rgba(5,3,10,0.9)', border:`1.5px solid ${found ? 'rgba(251,146,60,0.7)' : 'rgba(160,168,192,0.25)'}`,
              color:'white', fontSize:13, fontWeight:700, outline:'none', letterSpacing:'0.15em',
              fontFamily:'monospace', boxSizing:'border-box', transition:'border-color 0.2s',
              boxShadow: found ? '0 0 12px rgba(251,146,60,0.25)' : 'none',
            }}
            onKeyDown={e => { if (e.key === 'Enter' && found) onExecuteSeal(found); }}
          />
          <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>🔯</span>
        </div>
        <button
          onClick={() => found && onExecuteSeal(found)}
          disabled={!found}
          style={{
            padding:'10px 18px', borderRadius:12, fontSize:11, fontWeight:900, cursor: found ? 'pointer' : 'not-allowed',
            background: found ? 'linear-gradient(135deg,rgba(234,88,12,0.7),rgba(249,115,22,0.6))' : 'rgba(30,20,10,0.6)',
            border: found ? '1.5px solid rgba(234,88,12,0.5)' : '1px solid rgba(255,255,255,0.06)',
            color: found ? 'white' : 'rgba(150,140,130,0.3)',
            textTransform:'uppercase', letterSpacing:'0.1em',
            boxShadow: found ? '0 0 16px rgba(234,88,12,0.3)' : 'none',
          }}>
          ✦ Ativar
        </button>
        <button onClick={onCancel} style={{ padding:'10px', borderRadius:12, background:'rgba(30,12,12,0.8)', border:'1px solid rgba(220,38,38,0.25)', color:'#f87171', cursor:'pointer' }}>
          <X style={{ width:14, height:14 }} />
        </button>
      </div>

      {/* Found seal preview */}
      {found && (
        <div style={{
          padding:'12px 16px', borderRadius:14, animation:'cardDealIn 0.3s ease both',
          background:'linear-gradient(135deg,rgba(20,10,5,0.95),rgba(30,15,8,0.9))',
          border:'1.5px solid rgba(234,88,12,0.5)',
          boxShadow:'0 0 20px rgba(234,88,12,0.15)',
          display:'flex', alignItems:'flex-start', gap:12,
        }}>
          {found.image ? (
            <img src={found.image} style={{ width:52, height:52, borderRadius:10, objectFit:'cover', border:'1px solid rgba(234,88,12,0.4)', flexShrink:0 }} />
          ) : (
            <div style={{ width:52, height:52, borderRadius:10, background:'rgba(234,88,12,0.1)', border:'1px solid rgba(234,88,12,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🔯</div>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:900, color:'white', textTransform:'uppercase', letterSpacing:'0.05em' }}>{found.name}</span>
              <span style={{ fontSize:9, fontFamily:'monospace', padding:'1px 6px', borderRadius:6, background:'rgba(234,88,12,0.15)', border:'1px solid rgba(234,88,12,0.3)', color:'#fb923c', fontWeight:700 }}>#{found.code}</span>
              {found.executionMode === 'preparation' && <span style={{ fontSize:8, padding:'1px 6px', borderRadius:6, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc' }}>⏳{found.preparationRounds}rds</span>}
              {found.executionMode === 'combo' && <span style={{ fontSize:8, padding:'1px 6px', borderRadius:6, background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', color:'#4ade80' }}>🤝{found.comboMinUsers}+</span>}
            </div>
            <p style={{ fontSize:9, color:'rgba(148,163,184,0.7)', lineHeight:1.5, fontStyle:'italic', marginBottom:6 }}>{found.description?.slice(0,100)}{(found.description?.length ?? 0) > 100 ? '…' : ''}</p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const }}>
              {found.diceRoll && <span style={{ fontSize:8, color:'#94a3b8', background:'rgba(0,0,0,0.4)', padding:'2px 6px', borderRadius:6, border:'1px solid rgba(255,255,255,0.06)' }}>🎲 {found.diceRoll}</span>}
              {(found.damage ?? 0) > 0 && <span style={{ fontSize:8, color:'#f87171', background:'rgba(239,68,68,0.1)', padding:'2px 6px', borderRadius:6, border:'1px solid rgba(239,68,68,0.2)' }}>⚔ {found.damage}</span>}
              {(found.healHp ?? 0) > 0 && <span style={{ fontSize:8, color:'#4ade80', background:'rgba(34,197,94,0.1)', padding:'2px 6px', borderRadius:6, border:'1px solid rgba(34,197,94,0.2)' }}>💚 +{found.healHp}HP</span>}
              {(found.healAura ?? 0) > 0 && <span style={{ fontSize:8, color:'#67e8f9', background:'rgba(6,182,212,0.1)', padding:'2px 6px', borderRadius:6, border:'1px solid rgba(6,182,212,0.2)' }}>⚡ +{found.healAura}AU</span>}
              {found.cost?.hp && found.cost.hp > 0 && <span style={{ fontSize:8, color:'#f87171', padding:'2px 6px', borderRadius:6, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)' }}>−{found.cost.hp}HP</span>}
              {found.cost?.aura && found.cost.aura > 0 && <span style={{ fontSize:8, color:'#67e8f9', padding:'2px 6px', borderRadius:6, background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.15)' }}>−{found.cost.aura}AU</span>}
            </div>
          </div>
        </div>
      )}

      {error && !found && code.length >= 4 && (
        <p style={{ fontSize:10, color:'#f87171', textAlign:'center', padding:'6px', background:'rgba(239,68,68,0.08)', borderRadius:8, border:'1px solid rgba(239,68,68,0.2)' }}>
          ✕ {error}
        </p>
      )}

      {/* Quick access: all visible seals as mini cards */}
      {visibleSeals.length > 0 && (
        <div style={{ paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize:8, fontWeight:700, color:'rgba(251,146,60,0.5)', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:8, textAlign:'center' }}>
            Selos Disponíveis
          </p>
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, justifyContent: visibleSeals.length <= 4 ? 'center' : undefined }}>
            {visibleSeals.map((s, idx) => {
              const isHov = hovIdx === idx;
              return (
                <div
                  key={s.id}
                  onMouseEnter={() => setHovIdx(idx)}
                  onMouseLeave={() => setHovIdx(null)}
                  onClick={() => onExecuteSeal(s)}
                  style={{
                    flexShrink:0,
                    width: isHov ? CARD_W + 20 : CARD_W,
                    borderRadius:12, overflow:'hidden', cursor:'pointer',
                    background:'linear-gradient(165deg,rgba(20,10,5,0.97),rgba(30,15,5,0.95))',
                    border: `1.5px solid ${isHov ? 'rgba(251,146,60,0.7)' : 'rgba(234,88,12,0.25)'}`,
                    boxShadow: isHov ? '0 -8px 24px rgba(234,88,12,0.4), 0 0 0 1px rgba(234,88,12,0.4)' : '0 4px 12px rgba(0,0,0,0.6)',
                    transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    animation: `cardDealIn 0.4s cubic-bezier(0.22,1,0.36,1) ${idx * 0.07}s both${isHov ? ', hand-card-float 3.2s 0.5s ease-in-out infinite' : ''}`,
                    transform: isHov ? 'translateY(-8px)' : undefined,
                  }}>
                  {/* Accent line */}
                  <div style={{ height:3, background:'linear-gradient(90deg,transparent,rgba(234,88,12,0.8),transparent)', opacity: isHov ? 1 : 0.5 }} />
                  {s.image ? (
                    <img src={s.image} style={{ width:'100%', height:60, objectFit:'cover' }} />
                  ) : (
                    <div style={{ width:'100%', height:60, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, background:'rgba(234,88,12,0.05)' }}>🔯</div>
                  )}
                  <div style={{ padding:'6px 8px' }}>
                    <p style={{ fontSize:9, fontWeight:700, color: isHov ? '#fff' : 'rgba(255,255,255,0.8)', textTransform:'uppercase', letterSpacing:'0.05em', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</p>
                    <p style={{ fontSize:8, fontFamily:'monospace', color:'rgba(251,146,60,0.7)', marginTop:2 }}>#{s.code}</p>
                    {isHov && (
                      <div style={{ marginTop:4, display:'flex', gap:3, flexWrap:'wrap' as const }}>
                        {s.executionMode === 'preparation' && <span style={{ fontSize:7, padding:'1px 4px', borderRadius:4, background:'rgba(99,102,241,0.15)', color:'#a5b4fc' }}>⏳{s.preparationRounds}</span>}
                        {s.executionMode === 'combo' && <span style={{ fontSize:7, padding:'1px 4px', borderRadius:4, background:'rgba(34,197,94,0.12)', color:'#4ade80' }}>🤝{s.comboMinUsers}+</span>}
                        {(s.damage ?? 0) > 0 && <span style={{ fontSize:7, padding:'1px 4px', borderRadius:4, background:'rgba(239,68,68,0.1)', color:'#f87171' }}>⚔{s.damage}</span>}
                        {(s.healHp ?? 0) > 0 && <span style={{ fontSize:7, padding:'1px 4px', borderRadius:4, background:'rgba(34,197,94,0.1)', color:'#4ade80' }}>+{s.healHp}HP</span>}
                        <div style={{ fontSize:7, color:'rgba(251,146,60,0.7)', marginTop:2, textAlign:'center', width:'100%', fontWeight:700 }}>↑ Usar</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Card Fusion Panel ---
const CardFusionPanel: React.FC<{
  actor: any;
  allCards: Card[];
  onStartFusion: (selectedCards: Card[]) => void;
  onCancel: () => void;
}> = ({ actor, allCards, onStartFusion, onCancel }) => {
  const [selected, setSelected] = React.useState<string[]>([]);

  const toggleCard = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectedCards = allCards.filter(c => selected.includes(c.id));

  return (
    <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ fontSize:10, fontWeight:900, color:'#c4b5fd', textTransform:'uppercase', letterSpacing:'0.2em', textAlign:'center', paddingBottom:6, borderBottom:'1px solid rgba(196,181,253,0.2)' }}>
        ✦ FUSÃO DE CARTAS ✦
      </div>
      <div style={{ fontSize:9, color:'rgba(196,181,253,0.6)', textAlign:'center', letterSpacing:'0.1em' }}>
        Selecione 2 ou mais cartas para fundir
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:240, overflowY:'auto' }}>
        {allCards.map(card => {
          const isSel = selected.includes(card.id);
          return (
            <div key={card.id} onClick={() => toggleCard(card.id)}
              style={{
                display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:10,
                background: isSel ? 'rgba(139,92,246,0.25)' : 'rgba(0,0,0,0.35)',
                border: isSel ? '1.5px solid rgba(196,181,253,0.7)' : '1px solid rgba(100,80,180,0.2)',
                cursor:'pointer', transition:'all 0.15s',
              }}>
              {card.image
                ? <img src={card.image} style={{ width:28, height:28, borderRadius:6, objectFit:'cover', flexShrink:0 }} />
                : <div style={{ width:28, height:28, borderRadius:6, background:'rgba(139,92,246,0.2)', flexShrink:0 }} />
              }
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:700, color: isSel ? '#c4b5fd' : 'rgba(200,190,240,0.7)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{card.name}</div>
                <div style={{ fontSize:8, color:'rgba(148,163,184,0.5)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{card.type} · {card.diceRoll}</div>
              </div>
              <div style={{ width:16, height:16, borderRadius:4, border: isSel ? '2px solid #a855f7' : '2px solid rgba(100,80,180,0.35)', background: isSel ? '#a855f7' : 'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {isSel && <span style={{ fontSize:9, color:'white', fontWeight:900 }}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={onCancel}
          style={{ flex:1, padding:'8px', borderRadius:10, background:'rgba(30,12,12,0.9)', border:'1px solid rgba(220,38,38,0.3)', color:'#f87171', fontSize:10, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.1em' }}>
          ✕ Cancelar
        </button>
        <button
          onClick={() => selected.length >= 2 && onStartFusion(selectedCards)}
          disabled={selected.length < 2}
          style={{
            flex:2, padding:'8px', borderRadius:10, fontSize:10, fontWeight:700, cursor: selected.length >= 2 ? 'pointer' : 'not-allowed',
            background: selected.length >= 2 ? 'linear-gradient(135deg,rgba(139,92,246,0.5),rgba(109,40,217,0.7))' : 'rgba(30,20,50,0.5)',
            border: selected.length >= 2 ? '1px solid rgba(196,181,253,0.6)' : '1px solid rgba(100,80,180,0.2)',
            color: selected.length >= 2 ? '#c4b5fd' : 'rgba(150,140,180,0.3)',
            textTransform:'uppercase', letterSpacing:'0.1em', opacity: selected.length >= 2 ? 1 : 0.5,
          }}>
          ✦ Fundir {selected.length >= 2 ? '(' + selected.length + ')' : '—'}
        </button>
      </div>
    </div>
  );
};

// --- Aplicação Principal ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'combat' | 'cards' | 'seals' | 'characters' | 'extras' | 'journey'>('combat');
  const [extrasTab, setExtrasTab] = useState<'dice' | 'timer' | 'progress' | 'names' | 'loot' | 'notes'>('dice');
  
  const [cards, setCards] = useState<Card[]>([]);
  const [seals, setSeals] = useState<Seal[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [journey, setJourney] = useState<JourneyState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States para Tooltip e UX
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileRef = useRef<HTMLInputElement>(null);
  const [bgAspectRatio, setBgAspectRatio] = useState(1);
  // Import flow state
  const [importConfirmData, setImportConfirmData] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Histórico de Dados Manuais
  const [rollHistory, setRollHistory] = useState<{ id: string, result: number, type: string, timestamp: number }[]>([]);

  // State Timer
  const [timerTime, setTimerTime] = useState(0); // em segundos
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInput, setTimerInput] = useState({ h: 0, m: 0, s: 0 });

  // State Progress
  const [progressData, setProgressData] = useState({ label: 'Progresso Customizado', current: 0, max: 100 });
  // Extras: Dice enhancements
  const [diceQty, setDiceQty] = useState(1);
  const [diceBonus, setDiceBonus] = useState(0);
  const [customDiceSides, setCustomDiceSides] = useState(6);
  const [multiRollResults, setMultiRollResults] = useState<number[]>([]);
  // Extras: Name generator
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [nameStyle, setNameStyle] = useState<'fantasy' | 'nordic' | 'arabic' | 'japanese' | 'latin'>('fantasy');
  // Extras: Loot generator
  const [lootList, setLootList] = useState<{id:string;name:string;rarity:string}[]>([]);
  // Extras: GM notes
  const [gmNotes, setGmNotes] = useState('');
  // Multiple progress bars
  const [progressBars, setProgressBars] = useState([{ id:'1', label:'Progresso Customizado', current: 0, max: 100, color:'#d97706' }]);

  // Journey UI State
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [quickEditChar, setQuickEditChar] = useState<Character | null>(null);
  const [journeySubTab, setJourneySubTab] = useState<'mapa' | 'cozinhar' | 'forjar' | 'upgrades'>('mapa');
  const [recipeModal, setRecipeModal] = useState<{ mode: 'new' | 'edit'; recipe?: Recipe; type: RecipeType } | null>(null);
  const [craftResult, setCraftResult] = useState<{ recipe: Recipe; character: Character } | null>(null);
  const [craftCharacterId, setCraftCharacterId] = useState<string>('');
  const [editRecipeData, setEditRecipeData] = useState<Partial<Recipe>>({});
  // Upgrade shop UI state
  const [upgradeShopOfferCount, setUpgradeShopOfferCount] = useState(4);
  const [upgradeShopLuck, setUpgradeShopLuck] = useState<UpgradeLuck>('neutro');
  const [upgradeShopOffers, setUpgradeShopOffers] = useState<UpgradeOffer[]>([]);
  const [upgradeShopGenerated, setUpgradeShopGenerated] = useState(false);
  const [upgradePurchaseResult, setUpgradePurchaseResult] = useState<{ offer: UpgradeOffer; targetChar: Character } | null>(null);
  const [upgradeTargetCharId, setUpgradeTargetCharId] = useState<string>('');
  const [shopCurrency, setShopCurrency] = useState(0);
  // Per-character currencies (charId -> moedas)
  const [characterCurrencies, setCharacterCurrencies] = useState<Record<string, number>>({});
  // Active card item boost: which item (par/trinca/quadra/reroll) to apply when using a card
  const [activeCardItemBoost, setActiveCardItemBoost] = useState<{ charId: string; itemName: 'par' | 'trinca' | 'quadra' | 'reroll' } | null>(null);

  // Items UI State
  const [selectedInventoryCharId, setSelectedInventoryCharId] = useState<string | null>(null);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Conditions UI State
  const [managingConditionsCharId, setManagingConditionsCharId] = useState<string | null>(null);

  // Combat UI State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEndCombatConfirm, setShowEndCombatConfirm] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [combatCardFilter, setCombatCardFilter] = useState('');
  const [commandShowAllSearch, setCommandShowAllSearch] = useState('');
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [activeCommand, setActiveCommand] = useState<CommandType | null>(null);
  const [commandShowAll, setCommandShowAll] = useState(false);
  const [deckSearchTerm, setDeckSearchTerm] = useState('');
  const [deckTypeFilter, setDeckTypeFilter] = useState<CardType | 'all'>('all');
  const [showAddCombatantModal, setShowAddCombatantModal] = useState(false);
  const [initiativeStripPinned, setInitiativeStripPinned] = useState(false);
  const [initiativeStripHovered, setInitiativeStripHovered] = useState(false);
  // Turn change animation key — increments each turn to re-trigger CSS animations
  const [turnChangeKey, setTurnChangeKey] = useState(0);
  const [turnFlashing, setTurnFlashing] = useState(false);
  // (mobile mode removed)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [gridFullscreen, setGridFullscreen] = useState(false);
  const [showCustomPinModal, setShowCustomPinModal] = useState(false);
  const [newPinLabel, setNewPinLabel] = useState('');
  const [newPinColor, setNewPinColor] = useState('#ef4444');
  const [placingPin, setPlacingPin] = useState<{label: string; color: string} | null>(null);
  const [cardAnim, setCardAnim] = useState<CardAnimPayload | null>(null);
  // Grid drag state
  const [gridDragCombatId, setGridDragCombatId] = useState<string | null>(null);
  const [gridDragOverCell, setGridDragOverCell] = useState<{x:number;y:number}|null>(null);
  const [gridHoverCell, setGridHoverCell] = useState<{x:number;y:number}|null>(null);
  const [gridMoveHistory, setGridMoveHistory] = useState<Record<string,{from:{x:number;y:number};squares:number}>>({});
  const [showGridCoords, setShowGridCoords] = useState(false);
  const [gridSnapPreview, setGridSnapPreview] = useState<{combatId:string;x:number;y:number}|null>(null);

  // ── NEW: Combat enhancements ──────────────────────────────────
  // Turn timer
  const [turnTimerEnabled, setTurnTimerEnabled] = useState(false);
  const [turnTimerSeconds, setTurnTimerSeconds] = useState(60);
  const [turnTimerRemaining, setTurnTimerRemaining] = useState(60);
  const [turnTimerRunning, setTurnTimerRunning] = useState(false);
  // Combat notes (GM only, per session)
  const [combatNotes, setCombatNotes] = useState('');
  // Mass damage tool
  const [massDmgAmount, setMassDmgAmount] = useState('');
  const [massDmgMode, setMassDmgMode] = useState<'damage'|'heal'>('damage');
  const [massDmgTargets, setMassDmgTargets] = useState<string[]>([]);
  const [showMassDmgPanel, setShowMassDmgPanel] = useState(false);
  // Quick dice roll in combat sidebar
  const [combatQuickRoll, setCombatQuickRoll] = useState<{sides:number;result:number;timestamp:number}|null>(null);
  // Active left sidebar tab
  const [leftSidebarTab, setLeftSidebarTab] = useState<'status'|'unions'|'dice'|'notes'>('status');

  // Union state
  const [unionMode, setUnionMode] = useState(false);
  const [unionSelecting, setUnionSelecting] = useState<string[]>([]); // combatIds being selected
  const [unionColor, setUnionColor] = useState('#a855f7');

  // Stat animation popups: { id, combatId, type, delta, key }
  const [statPopups, setStatPopups] = useState<{ id: string; combatId: string; type: 'hp'|'aura'|'ammo'; delta: number }[]>([]);

  // Estados de "Pasta Oculta"

  // Novo Estado de Filtro de Cartas
  const [cardTypeFilter, setCardTypeFilter] = useState<CardType | 'all'>('all');

  // ── Combination card state ──────────────────────────────────
  const [comboCard, setComboCard] = useState<Card | null>(null); // card being combo'd
  const [comboParticipants, setComboParticipants] = useState<string[]>([]); // combatIds participating

  // ── Level selection state (for zoomed card) ────────────────
  const [zoomedCardLevel, setZoomedCardLevel] = useState<number>(1);

  // ── Acted combatants tracking ──────────────────────────────
  const [actedCombatantIds, setActedCombatantIds] = useState<Set<string>>(new Set());

  // ── Forma card state ────────────────────────────────────────
  const [formaAnimCard, setFormaAnimCard] = useState<Card | null>(null); // animação ativa de forma
  const [formaAnimCombatantId, setFormaAnimCombatantId] = useState<string | null>(null);

  // ── Card Fusion state ────────────────────────────────────────
  // ── NPC special card state ──────────────────────────────────
  const [npcWildcardModal, setNpcWildcardModal] = useState<{actor: any; command: string} | null>(null);
  const [npcSpecialCardModal, setNpcSpecialCardModal] = useState<{actor: any; cardType: 'contra-ataque' | 'armadura'} | null>(null);

  const [fusionStep, setFusionStep] = useState<'select' | 'rolling' | 'animating' | 'creating' | 'revealing' | null>(null);
  const [fusionSelectedCards, setFusionSelectedCards] = useState<Card[]>([]);
  const [fusionActor, setFusionActor] = useState<any | null>(null);
  const [fusionRolls, setFusionRolls] = useState<number[]>([]);
  const [fusionSuccess, setFusionSuccess] = useState<boolean>(false);
  const [fusionNewCard, setFusionNewCard] = useState<Card | null>(null);
  const [fusionRevealCard, setFusionRevealCard] = useState<Card | null>(null);

  // ── Pending item dice anim ───────────────────────────────────
  const [pendingItemAction, setPendingItemAction] = useState<{actor: any; item: any; targetId?: string; targeting: string} | null>(null);

  // ── Burn card state ──────────────────────────────────────────
  const [burningCard, setBurningCard] = useState<Card | null>(null);
  const [burnStep, setBurnStep] = useState<'targets' | 'config' | 'rolling' | 'destroyed'>('targets');
  const [burnTargets, setBurnTargets] = useState<string[]>([]);
  const [burnEffect, setBurnEffect] = useState<'damage' | 'healHp' | 'drainAura' | 'gainAura'>('damage');
  const [burnFixedValue, setBurnFixedValue] = useState<number>(1);
  const [burnDiceResult, setBurnDiceResult] = useState<number | null>(null);
  const [burnFinalValue, setBurnFinalValue] = useState<number | null>(null);
  const [burnActorCombatId, setBurnActorCombatId] = useState<string | null>(null);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerTime > 0) {
      interval = setInterval(() => {
        setTimerTime((prev) => prev - 1);
      }, 1000);
    } else if (timerTime === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerTime]);

  // ── Boot: inicializa DB, migra dados antigos, carrega tudo de uma vez ──
  useEffect(() => {
    let cancelled = false;

    DatabaseService.initialize().then(({ characters: chars, cards: cds, seals: sls, combat: cbt, journey: jny, extras }) => {
      if (cancelled) return;
      setCharacters(chars);
      setCards(cds);
      setSeals(sls);
      setCombat(cbt);
      setJourney(jny);
      // Restore extras state
      setGmNotes(extras.gmNotes ?? '');
      setCombatNotes(extras.combatNotes ?? '');
      setShopCurrency(extras.shopCurrency ?? 0);
      setCharacterCurrencies(extras.characterCurrencies ?? {});
      if (extras.progressBars?.length) setProgressBars(extras.progressBars);
      if (extras.rollHistory?.length) setRollHistory(extras.rollHistory);
      if (extras.lootList?.length) setLootList(extras.lootList);
      if (extras.nameStyle) setNameStyle(extras.nameStyle as any);
      setIsLoading(false);
    }).catch(err => {
      console.error('[Boot] Erro ao carregar dados:', err);
      if (!cancelled) setIsLoading(false);
    });

    // Subscriptions para atualizações em tempo real (ex: outra aba)
    const unsubChars = DatabaseService.syncCharacters((data) => { if (!cancelled) setCharacters(data); });
    const unsubCards = DatabaseService.syncCards((data) => { if (!cancelled) setCards(data); });
    const unsubSeals = DatabaseService.syncSeals((data) => { if (!cancelled) setSeals(data); });
    const unsubCombat = DatabaseService.syncCombatState((data) => { if (!cancelled) setCombat(data); });
    const unsubJourney = DatabaseService.syncJourneyState((data) => { if (!cancelled) setJourney(data); });

    return () => {
      cancelled = true;
      unsubChars(); unsubCards(); unsubSeals(); unsubCombat(); unsubJourney();
    };
  }, []);

  // ── Autosave a cada 45s — salva TUDO incluindo extras ─────────────
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (isLoading) return; // Não salva enquanto ainda está carregando
    const INTERVAL_MS = 45_000;
    const interval = setInterval(async () => {
      try {
        setAutoSaveStatus('saving');
        await DatabaseService.saveFullSnapshot({
          version: 3,
          savedAt: new Date().toISOString(),
          characters,
          cards,
          seals,
          combat: combat!,
          journey: journey!,
          extras: {
            gmNotes,
            combatNotes,
            shopCurrency,
            characterCurrencies,
            progressBars,
            rollHistory,
            lootList,
            nameStyle,
          },
        });
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2500);
      } catch (e) {
        console.error('[Autosave] Erro:', e);
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isLoading, characters, cards, seals, combat, journey, gmNotes, combatNotes, shopCurrency, characterCurrencies, progressBars, rollHistory, lootList, nameStyle]);

  // ── Salva extras no IDB em tempo real quando mudam ─────────────
  // (debounce 2s para não sobrecarregar o IDB a cada keystroke)
  useEffect(() => {
    if (isLoading) return;
    const t = setTimeout(() => {
      DatabaseService.updateExtras({ gmNotes, combatNotes, shopCurrency, characterCurrencies, progressBars, rollHistory, lootList, nameStyle });
    }, 2000);
    return () => clearTimeout(t);
  }, [isLoading, gmNotes, combatNotes, shopCurrency, characterCurrencies, progressBars, rollHistory, lootList, nameStyle]);

  // placeholder removido — lógica migrada para useEffect de boot acima

  const handleManualSaveRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (placingPin) setPlacingPin(null);
        if (gridFullscreen) setGridFullscreen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSaveRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [placingPin, gridFullscreen]);

  // ── Turn timer countdown ──────────────────────────────────────
  useEffect(() => {
    if (!turnTimerRunning || !turnTimerEnabled) return;
    if (turnTimerRemaining <= 0) {
      setTurnTimerRunning(false);
      return;
    }
    const t = setInterval(() => setTurnTimerRemaining(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [turnTimerRunning, turnTimerEnabled, turnTimerRemaining]);

  // Effect para ajustar Aspect Ratio da Imagem de Fundo
  useEffect(() => {
    if (combat?.backgroundImage) {
      const img = new Image();
      img.src = combat.backgroundImage;
      img.onload = () => {
        if (img.height > 0) {
           setBgAspectRatio(img.width / img.height);
        }
      };
    } else {
      setBgAspectRatio(1);
    }
  }, [combat?.backgroundImage]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sealSearchTerm, setSealSearchTerm] = useState('');
  const [combatantSearchTerm, setCombatantSearchTerm] = useState('');
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingSeal, setEditingSeal] = useState<Seal | null>(null);
  const [sealRitualAnim, setSealRitualAnim] = useState<{seal: Seal; effects: string[]} | null>(null);
  const [itemUseAnim, setItemUseAnim] = useState<Item | null>(null);
  const [openInventoryCharId, setOpenInventoryCharId] = useState<string | null>(null);
  const [sealCodeInput, setSealCodeInput] = useState('');
  const [sealCodeModal, setSealCodeModal] = useState<{actor: any} | null>(null);
  const [activeSealPrep, setActiveSealPrep] = useState<{sealId: string; actorCombatId: string; roundsLeft: number; comboParticipants?: string[]} | null>(null);
  const [sealComboSelectModal, setSealComboSelectModal] = useState<{seal: Seal; actor: any} | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [setupCombatant, setSetupCombatant] = useState<Character | null>(null);
  const [assignCardModal, setAssignCardModal] = useState<Card | null>(null);
  const [itemTargetPickerItem, setItemTargetPickerItem] = useState<{ actor: any; item: any } | null>(null);
  const [showHideNpcs, setShowHideNpcs] = useState(false);
  // Initiative drag-to-reorder
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [diceAnim, setDiceAnim] = useState<{ isVisible: boolean; result: number; defenderResult?: number; isSuccess: boolean; customLabel?: string; notation?: string; individualRolls?: number[]; numSides?: number; bonus?: number } | null>(null);
  const [selectingTargetFor, setSelectingTargetFor] = useState<Card | null>(null);
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);
  
  // Atualizado para suportar múltiplas reações
  const [isReactionPrompt, setIsReactionPrompt] = useState<{ target: Combatant; availableReactions: Card[]; attacker: Combatant; activeCard: Card; } | null>(null);
  
  const [impactTargetId, setImpactTargetId] = useState<string | null>(null);
  const [collapsedCardGroups, setCollapsedCardGroups] = useState<Record<string, boolean>>({});
  const [turnBanner, setTurnBanner] = useState<{ name: string; icon: string; isFumbleTurnPass?: boolean } | null>(null);
  const [conditionExpiryNotifs, setConditionExpiryNotifs] = useState<string[]>([]);
  const [hoveredCardIdx, setHoveredCardIdx] = useState<number | null>(null);
  // Area multi-target selection
  const [areaSelectedTargets, setAreaSelectedTargets] = useState<string[]>([]);
  // Card zoom overlay state (when a card is clicked but before target is chosen)
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null);

  const currentActor = combat?.isActive && combat.combatants.length > 0 ? combat.combatants[combat.turnIndex] : null;

  // Filtros de Cartas (Habilidades)
  const filteredCards = useMemo(() => cards.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (cardTypeFilter === 'all' || c.type === cardTypeFilter)
  ), [cards, searchTerm, cardTypeFilter]);

  const filteredSeals = useMemo(() => seals.filter(s =>
    s.name.toLowerCase().includes(sealSearchTerm.toLowerCase()) ||
    s.code?.toLowerCase().includes(sealSearchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(sealSearchTerm.toLowerCase())
  ), [seals, sealSearchTerm]);
  
  // Filtros de Personagens
  const filteredCharacters = useMemo(() => characters.filter(c => !!c.id), [characters]);

  const groupedCards = useMemo(() => {
    const groups: Record<CardType, Card[]> = { 'ataque': [], 'reação': [], 'ação': [], 'reforço': [], 'vínculo': [], 'combinação': [], 'forma': [] };
    cards.forEach(card => { groups[card.type].push(card); });
    return groups;
  }, [cards]);

  const filteredCombatants = useMemo(() => {
    if (!combat) return [];
    return combat.combatants.filter(c => c.name.toLowerCase().includes(combatantSearchTerm.toLowerCase()));
  }, [combat, combatantSearchTerm]);

  const journeyCharacters = useMemo(() => characters.filter(c => c.isInJourney), [characters]);

  const inventoryCharacters = useMemo(() => characters.filter(c => c.name.toLowerCase().includes(inventorySearchTerm.toLowerCase())), [characters, inventorySearchTerm]);

  const selectedInventoryChar = useMemo(() => characters.find(c => c.id === selectedInventoryCharId), [characters, selectedInventoryCharId]);

  // Helper para o modal de condições
  const characterForConditions = useMemo(() => {
    if (!managingConditionsCharId) return null;
    if (combat) {
        const combatant = combat.combatants.find(c => c.combatId === managingConditionsCharId);
        if (combatant) return { ...combatant, isCombatant: true, realId: combatant.id };
        const combatantByCharId = combat.combatants.find(c => c.id === managingConditionsCharId);
        if (combatantByCharId) return { ...combatantByCharId, isCombatant: true, realId: combatantByCharId.id };
    }
    const char = characters.find(c => c.id === managingConditionsCharId);
    if (char) return { ...char, isCombatant: false, realId: char.id };
    return null;
  }, [managingConditionsCharId, combat, characters]);

  const isCharInCombat = (charId: string) => combat?.combatants.some(c => c.id === charId) ?? false;

  // Handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  // ── Export completo (inclui TODOS os dados + extras) ─────────────
  const handleDownloadBackup = async () => {
    try {
      setAutoSaveStatus('saving');
      // Constrói snapshot direto do IDB (fonte da verdade)
      // mas sobrescreve extras com o estado React atual (pode ser mais novo que o IDB)
      const snapshot = await DatabaseService.buildSnapshot();
      // Sobrescreve extras com o estado atual do React (pode não ter sido salvo ainda)
      snapshot.extras = {
        gmNotes,
        combatNotes,
        shopCurrency,
        characterCurrencies,
        progressBars,
        rollHistory,
        lootList,
        nameStyle,
      };
      // Garante que os dados do React (mais recentes) são usados para as entidades principais também
      snapshot.characters = characters;
      snapshot.cards = cards;
      snapshot.seals = seals;
      if (combat) snapshot.combat = combat;
      if (journey) snapshot.journey = journey;
      snapshot.savedAt = new Date().toISOString();

      const json = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vat_backup_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
    } catch (e) {
      console.error('[Export] Erro:', e);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  };

  // ── Salvar manualmente agora (Ctrl+S ou botão) ────────────────────
  const handleManualSave = async () => {
    if (isLoading || !combat || !journey) return;
    try {
      setAutoSaveStatus('saving');
      await DatabaseService.saveFullSnapshot({
        version: 3,
        savedAt: new Date().toISOString(),
        characters,
        cards,
        seals,
        combat,
        journey,
        extras: { gmNotes, combatNotes, shopCurrency, characterCurrencies, progressBars, rollHistory, lootList, nameStyle },
      });
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
    } catch (e) {
      console.error('[ManualSave] Erro:', e);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  };
  // Keep ref in sync so Ctrl+S always uses latest closure
  handleManualSaveRef.current = handleManualSave;

  // ── Import: restaura snapshot de arquivo ──────────────────────────
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input para permitir re-importar o mesmo arquivo
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const raw = event.target?.result as string;
      if (!raw) {
        setImportError('Arquivo vazio ou ilegível.');
        return;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        setImportError(`Erro ao ler JSON: ${(parseErr as Error).message}`);
        return;
      }

      setImportError(null);
      setImportConfirmData(parsed);
    };
    reader.onerror = () => setImportError('Erro ao ler o arquivo.');
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!importConfirmData) return;
    setImportError(null);
    setAutoSaveStatus('saving');
    const result = await DatabaseService.restoreSnapshot(importConfirmData);
    setImportConfirmData(null);
    if (result.ok) {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
      // Recarrega os extras no estado React após import
      const extras = importConfirmData.extras ?? {};
      if (extras.gmNotes !== undefined) setGmNotes(extras.gmNotes);
      if (extras.combatNotes !== undefined) setCombatNotes(extras.combatNotes);
      if (extras.shopCurrency !== undefined) setShopCurrency(extras.shopCurrency);
      if (extras.characterCurrencies) setCharacterCurrencies(extras.characterCurrencies);
      if (extras.progressBars?.length) setProgressBars(extras.progressBars);
      if (extras.rollHistory?.length) setRollHistory(extras.rollHistory);
      if (extras.lootList?.length) setLootList(extras.lootList);
      if (extras.nameStyle) setNameStyle(extras.nameStyle);
    } else {
      setAutoSaveStatus('error');
      setImportError(result.error ?? 'Erro desconhecido ao importar.');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  };

  const saveCharacter = (char: Character) => {
    const finalChar = char.id ? char : { ...char, id: Math.random().toString(36).substr(2, 9) };
    DatabaseService.saveCharacter(finalChar);
    if (combat?.isActive) {
      const updatedCombatants = combat.combatants.map(cb => 
        cb.id === finalChar.id ? { ...cb, ...finalChar, combatId: cb.combatId, initiativeResult: cb.initiativeResult, gridPos: cb.gridPos } : cb
      );
      DatabaseService.updateCombat({ ...combat, combatants: updatedCombatants });
    }
  };

  // Handler para fixar/desafixar carta na mão de um combatente
  const handleTogglePinCard = (combatantId: string, cardId: string) => {
    if (!combat) return;
    const MAX_PINS = 7;
    const combatant = combat.combatants.find(c => c.combatId === combatantId || c.id === combatantId);
    if (!combatant) return;
    const pinned = combatant.pinnedCardIds || [];
    let newPinned: string[];
    if (pinned.includes(cardId)) {
      newPinned = pinned.filter(id => id !== cardId);
    } else {
      if (pinned.length >= MAX_PINS) {
        alert(`Você já tem ${MAX_PINS} cartas fixadas na mão!`);
        return;
      }
      newPinned = [...pinned, cardId];
    }
    const updatedCombatants = combat.combatants.map(c =>
      (c.combatId === combatantId || c.id === combatantId) ? { ...c, pinnedCardIds: newPinned } : c
    );
    const newCombat = { ...combat, combatants: updatedCombatants };
    DatabaseService.updateCombat(newCombat);
    // Também salvar na ficha do personagem (Character)
    const char = characters.find(ch => ch.id === combatant.id);
    if (char) {
      DatabaseService.saveCharacter({ ...char, pinnedCardIds: newPinned });
    }
  };

  const handleSaveItem = (item: Item) => {
    if (!selectedInventoryChar) return;
    let updatedItems;
    if (item.id && selectedInventoryChar.items.some(i => i.id === item.id)) {
        updatedItems = selectedInventoryChar.items.map(i => i.id === item.id ? item : i);
    } else {
        const finalItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
        updatedItems = [...(selectedInventoryChar.items || []), finalItem];
    }
    updateCharacterStats(selectedInventoryChar.id, { items: updatedItems });
    setEditingItem(null);
  };

  const removeItemFromCharacter = (itemId: string) => {
    if (!selectedInventoryChar) return;
    setConfirmModal({
      message: "Deseja remover este item do inventário?",
      onConfirm: () => {
        const updatedItems = selectedInventoryChar.items.filter(i => i.id !== itemId);
        updateCharacterStats(selectedInventoryChar.id, { items: updatedItems });
        setEditingItem(null);
        setConfirmModal(null);
      }
    });
  };

  const deleteCharacter = async (id: string) => {
    setConfirmModal({
      message: "Deseja excluir este personagem permanentemente?",
      onConfirm: async () => {
        setCharacters(prev => prev.filter(c => c.id !== id));
        if (combat) {
          const updatedCombat = { ...combat, combatants: combat.combatants.filter(c => c.id !== id) };
          setCombat(updatedCombat);
          DatabaseService.updateCombat(updatedCombat);
        }
        setEditingCharacter(null);
        setConfirmModal(null);
        try {
          await DatabaseService.deleteCharacter(id);
        } catch (err) {
          console.error("Erro ao deletar personagem:", err);
        }
      }
    });
  };

  const toggleJourneyCharacter = (char: Character) => {
    const updatedChar = { ...char, isInJourney: !char.isInJourney };
    saveCharacter(updatedChar);
  };

  const WEATHER_FIELD_CONDITIONS: Record<string, { id: string; name: string; description?: string }> = {
    rain:  { id: '__weather_rain__',  name: '🌧️ Chuva',          },
    storm: { id: '__weather_storm__', name: '⚡ Tempestade',     },
    fog:   { id: '__weather_fog__',   name: '🌫️ Névoa Densa',   },
    snow:  { id: '__weather_snow__',  name: '❄️ Nevasca',         },
  };

  const syncWeatherFieldConditions = (effects: ('rain' | 'storm' | 'fog' | 'snow')[], currentCombat?: CombatState | null) => {
    const c = currentCombat ?? combat;
    if (!c) return;
    // Remove all existing weather field conditions
    const weatherIds = Object.values(WEATHER_FIELD_CONDITIONS).map(w => w.id);
    let newFC = c.fieldConditions.filter(f => !weatherIds.includes(f.id));
    // Add the new active weather effects
    effects.forEach(eff => {
      const wfc = WEATHER_FIELD_CONDITIONS[eff];
      newFC.push({ id: wfc.id, name: wfc.name, duration: 999 });
    });
    updateCombat({ ...c, fieldConditions: newFC });
  };

  const updateJourney = (newState: Partial<JourneyState>) => {
    if (!journey) return;
    const merged = { ...journey, ...newState };
    DatabaseService.updateJourney(merged);
    // Sync weather effects to combat field conditions
    if (newState.weatherEffects !== undefined) {
      syncWeatherFieldConditions(newState.weatherEffects);
    }
  };

  // ── Recipe / Crafting handlers ─────────────────────────────────
  const saveRecipe = (recipe: Recipe) => {
    if (!journey) return;
    const recipes = journey.recipes || [];
    const existing = recipes.findIndex(r => r.id === recipe.id);
    const newRecipes = existing >= 0
      ? recipes.map(r => r.id === recipe.id ? recipe : r)
      : [...recipes, recipe];
    updateJourney({ recipes: newRecipes });
  };

  const deleteRecipe = (id: string) => {
    if (!journey) return;
    updateJourney({ recipes: (journey.recipes || []).filter(r => r.id !== id) });
  };

  const executeRecipe = (recipe: Recipe, characterId: string) => {
    const char = characters.find(c => c.id === characterId);
    if (!char) { alert('Personagem não encontrado.'); return; }

    // Check if character has all ingredients
    for (const ing of recipe.ingredients) {
      const charItem = (char.items || []).find(it => it.name.toLowerCase() === ing.itemName.toLowerCase());
      const available = charItem?.quantity ?? (charItem ? 1 : 0);
      if (available < ing.quantity) {
        alert(`${char.name} não tem ${ing.quantity}x "${ing.itemName}" (tem ${available}).`);
        return;
      }
    }

    // Consume ingredients
    let updatedItems = [...(char.items || [])];
    for (const ing of recipe.ingredients) {
      updatedItems = updatedItems.map(it => {
        if (it.name.toLowerCase() === ing.itemName.toLowerCase()) {
          const newQty = (it.quantity ?? 1) - ing.quantity;
          return newQty <= 0 ? null : { ...it, quantity: newQty };
        }
        return it;
      }).filter(Boolean) as Item[];
    }

    // Add result item
    const existingResult = updatedItems.find(it => it.name.toLowerCase() === recipe.resultItemName.toLowerCase());
    if (existingResult) {
      updatedItems = updatedItems.map(it =>
        it.name.toLowerCase() === recipe.resultItemName.toLowerCase()
          ? { ...it, quantity: (it.quantity ?? 1) + recipe.resultQuantity }
          : it
      );
    } else {
      updatedItems.push({
        id: Math.random().toString(36).substr(2, 9),
        name: recipe.resultItemName,
        description: recipe.resultDescription || recipe.description,
        image: recipe.resultImage || '',
        quantity: recipe.resultQuantity,
        category: recipe.resultCategory || (recipe.type === 'cozinhar' ? 'Comida' : 'Forjado'),
      });
    }

    const updatedChar = { ...char, items: updatedItems };
    saveCharacter(updatedChar);
    setCraftResult({ recipe, character: updatedChar });
  };

  // ── UPGRADE SHOP ──────────────────────────────────────────────────────────
  const UPGRADE_OFFER_POOL: Array<{
    type: UpgradeOfferType;
    label: string;
    descFn: (v: number) => string;
    basePrice: number;
    weight: number; // total 100
    valueFn: () => number;
    rarity: UpgradeOffer['rarity'];
  }> = [
    { type:'vitalidade', label:'Vitalidade', descFn: v => `+${v} HP Máximo (azar=2, normal=5-10, sorte=até 20)`, basePrice:30, weight:28, valueFn: () => {
        const luck = upgradeShopLuck;
        if (luck === 'azar') return 2;
        if (luck === 'sorte') {
          // Scale up: uniform between 2 and 20, skewed toward higher values
          const r = Math.random();
          return Math.round(2 + r * r * 18); // quadratic skew toward high
        }
        // neutro: 2-10 linear
        return Math.floor(Math.random() * 5 + 3) * 2; // 6,8,10,12 range
      }, rarity:'common' },
    { type:'aura',       label:'Aura',       descFn: v => `+${v} Aura Máxima (azar=1, normal=2-5, sorte=até 10)`, basePrice:30, weight:25, valueFn: () => {
        const luck = upgradeShopLuck;
        if (luck === 'azar') return 1;
        if (luck === 'sorte') {
          const r = Math.random();
          return Math.round(1 + r * r * 9); // 1 to 10, skewed high
        }
        return Math.floor(Math.random() * 3 + 2); // 2-4 range
      }, rarity:'common' },
    { type:'reroll',     label:'Reroll',     descFn: () => 'Item de Reroll: em caso de falha na rolagem de uma carta, você pode consumir este item para rolar novamente', basePrice:50, weight:16, valueFn: () => 0, rarity:'uncommon' },
    { type:'par',        label:'Par',        descFn: () => 'Item Par: ao usar uma carta com dado, rola 2 dados e usa o maior (+1 rolagem)', basePrice:70, weight:12, valueFn: () => 0, rarity:'uncommon' },
    { type:'trinca',     label:'Trinca',     descFn: () => 'Item Trinca: ao usar uma carta com dado, rola 3 dados e usa o maior (+2 rolagens)', basePrice:110, weight:8, valueFn: () => 0, rarity:'rare' },
    { type:'quadra',     label:'Quadra',     descFn: () => 'Item Quadra: ao usar uma carta com dado, rola 4 dados e usa o maior (+3 rolagens)', basePrice:160, weight:6, valueFn: () => 0, rarity:'rare' },
    { type:'nova_carta', label:'Nova Carta', descFn: () => 'Habilidade aleatória — uma nova carta misteriosa é adicionada diretamente ao personagem', basePrice:120, weight:4, valueFn: () => 0, rarity:'rare' },
    { type:'desejo',     label:'Desejo',     descFn: () => 'Desejo especial do personagem — efeito único e poderoso, definido pelo Mestre com base nos anseios do herói', basePrice:400, weight:1, valueFn: () => 0, rarity:'legendary' },
  ];

  const RARITY_COLORS: Record<string, { border: string; bg: string; label: string; glow: string }> = {
    common:    { border:'rgba(148,163,184,0.4)', bg:'rgba(15,20,30,0.9)',    label:'#94a3b8', glow:'rgba(148,163,184,0.15)' },
    uncommon:  { border:'rgba(52,211,153,0.5)',  bg:'rgba(5,25,18,0.92)',    label:'#34d399', glow:'rgba(52,211,153,0.2)' },
    rare:      { border:'rgba(99,102,241,0.6)',  bg:'rgba(8,8,28,0.94)',     label:'#818cf8', glow:'rgba(99,102,241,0.25)' },
    legendary: { border:'rgba(251,191,36,0.8)',  bg:'rgba(20,14,2,0.96)',    label:'#fbbf24', glow:'rgba(251,191,36,0.4)' },
  };

  const generateUpgradeOffers = () => {
    const count = upgradeShopOfferCount;
    const luck = upgradeShopLuck;
    const offers: UpgradeOffer[] = [];

    // Build weighted pool based on luck
    const adjustedPool = UPGRADE_OFFER_POOL.map(item => {
      let w = item.weight;
      if (luck === 'sorte') {
        // Low-weight items get boosted, high-weight get reduced
        w = item.weight <= 4 ? item.weight * 5 : item.weight <= 8 ? item.weight * 2.5 : item.weight * 0.6;
      } else if (luck === 'azar') {
        // High-weight items get boosted, low-weight get reduced
        w = item.weight >= 20 ? item.weight * 2 : item.weight >= 12 ? item.weight * 1.4 : item.weight * 0.3;
      }
      return { ...item, adjustedWeight: Math.max(0.5, w) };
    });

    const totalWeight = adjustedPool.reduce((s, i) => s + i.adjustedWeight, 0);

    for (let i = 0; i < count; i++) {
      // Weighted random pick (no repeats of same type if possible)
      const used = offers.map(o => o.type);
      const available = adjustedPool.filter(p => !used.includes(p.type) || adjustedPool.length <= used.length);
      const pool = available.length > 0 ? available : adjustedPool;
      const poolTotal = pool.reduce((s, p) => s + p.adjustedWeight, 0);
      let rand = Math.random() * poolTotal;
      let chosen = pool[pool.length - 1];
      for (const item of pool) { rand -= item.adjustedWeight; if (rand <= 0) { chosen = item; break; } }

      // Price modifier based on luck
      let priceModifier = 1.0;
      if (luck === 'sorte') {
        // Rarer items get discount more often
        const discountChance = chosen.rarity === 'legendary' ? 0.7 : chosen.rarity === 'rare' ? 0.5 : 0.3;
        if (Math.random() < discountChance) priceModifier = 0.6 + Math.random() * 0.3; // 60-90%
      } else if (luck === 'azar') {
        // Common items get price hike more often
        const hikeChance = chosen.rarity === 'common' ? 0.7 : chosen.rarity === 'uncommon' ? 0.5 : 0.2;
        if (Math.random() < hikeChance) priceModifier = 1.1 + Math.random() * 0.5; // 110-160%
      } else {
        // Neutro: small random variation ±20%
        priceModifier = 0.85 + Math.random() * 0.35;
      }
      priceModifier = Math.round(priceModifier * 20) / 20; // round to 0.05 steps

      const value = chosen.valueFn();
      // For vitalidade/aura, price scales proportionally with value
      // HP: min=2 (base 15🪙) max=20 (base 150🪙), linear
      // Aura: min=1 (base 15🪙) max=10 (base 150🪙), linear
      let effectiveBasePrice = chosen.basePrice;
      if (chosen.type === 'vitalidade' && value > 0) {
        // 2 HP = 15 coins (minimum/azar), 20 HP = 150 coins (maximum/sorte)
        effectiveBasePrice = Math.round(15 + (value - 2) / 18 * 135);
      } else if (chosen.type === 'aura' && value > 0) {
        // 1 Aura = 15 coins, 10 Aura = 150 coins
        effectiveBasePrice = Math.round(15 + (value - 1) / 9 * 135);
      }
      const finalPrice = Math.max(10, Math.round(effectiveBasePrice * priceModifier / 5) * 5);

      offers.push({
        id: Math.random().toString(36).substr(2,9),
        type: chosen.type,
        label: chosen.label,
        description: chosen.type === 'vitalidade' ? `+${value} HP Máximo` : chosen.type === 'aura' ? `+${value} Aura Máxima` : chosen.descFn(value),
        basePrice: effectiveBasePrice,
        finalPrice,
        priceModifier,
        value,
        rarity: chosen.rarity,
      });
    }
    setUpgradeShopOffers(offers);
    setUpgradeShopGenerated(true);
  };

  const rerollUpgradeShop = () => {
    setUpgradeShopGenerated(false);
    setTimeout(() => generateUpgradeOffers(), 50);
  };

  const purchaseUpgrade = (offer: UpgradeOffer, charId: string) => {
    const charCurr = characterCurrencies[charId] || 0;
    if (charCurr < offer.finalPrice) { alert('Moedas insuficientes para este personagem!'); return; }
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    let updatedChar = { ...char };

    if (offer.type === 'vitalidade') {
      const gain = offer.value || 2;
      updatedChar = { ...updatedChar, maxHp: updatedChar.maxHp + gain, currentHp: updatedChar.currentHp + gain };
    } else if (offer.type === 'aura') {
      const gain = offer.value || 1;
      updatedChar = { ...updatedChar, maxAura: updatedChar.maxAura + gain, currentAura: updatedChar.currentAura + gain };
    } else if (['par', 'trinca', 'quadra', 'reroll'].includes(offer.type)) {
      // Add as inventory item
      const itemName = offer.type === 'par' ? 'Par' : offer.type === 'trinca' ? 'Trinca' : offer.type === 'quadra' ? 'Quadra' : 'Reroll';
      const itemDesc = offer.type === 'par' ? 'Rola 2 dados ao usar uma carta (+1 rolagem), usa o melhor resultado.'
        : offer.type === 'trinca' ? 'Rola 3 dados ao usar uma carta (+2 rolagens), usa o melhor resultado.'
        : offer.type === 'quadra' ? 'Rola 4 dados ao usar uma carta (+3 rolagens), usa o melhor resultado.'
        : 'Em caso de falha ao usar uma carta, relança o dado uma vez.';
      const existingItem = updatedChar.items.find(it => it.name.toLowerCase() === itemName.toLowerCase() && it.category === 'Upgrade');
      if (existingItem) {
        updatedChar = { ...updatedChar, items: updatedChar.items.map(it => it.name.toLowerCase() === itemName.toLowerCase() && it.category === 'Upgrade'
          ? { ...it, quantity: (it.quantity ?? 1) + 1 }
          : it
        )};
      } else {
        const newItem: Item = {
          id: Math.random().toString(36).substr(2,9),
          name: itemName,
          description: itemDesc,
          image: '',
          category: 'Upgrade',
          quantity: 1,
          consumeOnUse: true,
        };
        updatedChar = { ...updatedChar, items: [...updatedChar.items, newItem] };
      }
    } else if (offer.type === 'nova_carta') {
      // Redirect to card creation pre-assigned to this character
      setUpgradePurchaseResult({ offer, targetChar: updatedChar });
      setCharacterCurrencies(prev => ({ ...prev, [charId]: (prev[charId] || 0) - offer.finalPrice }));
      setUpgradeShopOffers(prev => prev.filter(o => o.id !== offer.id));
      // Open card creation modal for this character
      setTimeout(() => {
        setEditingCard({ id: '', name: '', image: '', auraCost: 1, type: 'ação' as CardType, description: 'Habilidade aleatória gerada pelo Destino.', conditions: [], items: [], _assignToCharId: charId } as any);
      }, 400);
      return;
    }

    saveCharacter(updatedChar);
    setCharacterCurrencies(prev => ({ ...prev, [charId]: (prev[charId] || 0) - offer.finalPrice }));
    setUpgradePurchaseResult({ offer, targetChar: updatedChar });
    setUpgradeShopOffers(prev => prev.filter(o => o.id !== offer.id));
  };

  const fireStatPopup = (combatId: string, type: 'hp'|'aura'|'ammo', delta: number) => {
    if (delta === 0) return;
    const popup = { id: Math.random().toString(36).substr(2,9), combatId, type, delta };
    setStatPopups(prev => [...prev, popup]);
    setTimeout(() => setStatPopups(prev => prev.filter(p => p.id !== popup.id)), 1800);
  };

  const updateCharacterStats = (charId: string, updates: Partial<Character>) => {
    const originalChar = characters.find(c => c.id === charId);
    if (!originalChar) return;
    // Fire animations for stat changes
    if (combat) {
      const combatant = combat.combatants.find(c => c.id === charId);
      if (combatant) {
        if (updates.currentHp !== undefined) fireStatPopup(combatant.combatId, 'hp', updates.currentHp - combatant.currentHp);
        if (updates.currentAura !== undefined) fireStatPopup(combatant.combatId, 'aura', updates.currentAura - combatant.currentAura);
        if (updates.currentAmmo !== undefined) fireStatPopup(combatant.combatId, 'ammo', updates.currentAmmo - (combatant.currentAmmo ?? 0));
      }
    }
    const updatedChar = { ...originalChar, ...updates };
    DatabaseService.saveCharacter(updatedChar);
    if (combat && isCharInCombat(charId)) {
        const updatedCombatants = combat.combatants.map(c => 
            c.id === charId ? { ...c, ...updates } : c
        );
        DatabaseService.updateCombat({ ...combat, combatants: updatedCombatants });
    }
  };

  const applyItemEffects = (actor: any, item: any, targetCombatant?: any) => {
    // Deduct ammo cost from actor
    if ((item.combatAmmoCost ?? 0) > 0 && (actor.maxAmmo ?? 0) > 0) {
      const newAmmoActor = Math.max(0, (actor.currentAmmo ?? 0) - item.combatAmmoCost);
      updateCharacterStats(actor.id, { currentAmmo: newAmmoActor });
      fireStatPopup(actor.combatId, 'ammo', -item.combatAmmoCost);
    }

    // Consume item if flagged
    if (item.consumeOnUse) {
      const char = characters.find((c: any) => c.id === actor.id);
      if (char) {
        const updatedItems = char.items.map((it: Item) => {
          if (it.id !== item.id) return it;
          return { ...it, quantity: Math.max(0, (it.quantity ?? 1) - 1) };
        });
        updateCharacterStats(actor.id, { items: updatedItems });
      }
    }

    // Apply effects to the recipient (self or target)
    const recipient = targetCombatant ?? actor;
    const recipientId = recipient.id;
    let newHp = recipient.currentHp;
    let newAura = recipient.currentAura;
    let newAmmo = recipient.currentAmmo ?? 0;

    let diceBonus = 0;
    if (item.combatDiceRoll) {
      try { diceBonus = rollDice(item.combatDiceRoll, 0).total; } catch {}
    }

    if ((item.combatHeal ?? 0) > 0) newHp = Math.min(recipient.maxHp, newHp + item.combatHeal + diceBonus);
    else if ((item.combatDamage ?? 0) > 0) newHp = Math.max(0, newHp - item.combatDamage - diceBonus);

    if ((item.combatAuraRecover ?? 0) > 0) newAura = Math.min(recipient.maxAura, newAura + item.combatAuraRecover);
    if ((item.combatAmmoRecover ?? 0) > 0) newAmmo = Math.min(recipient.maxAmmo ?? 0, newAmmo + item.combatAmmoRecover);

    const statUpdates: Partial<Character> = {};
    if (newHp !== recipient.currentHp) { statUpdates.currentHp = newHp; fireStatPopup(recipient.combatId || '', 'hp', newHp - recipient.currentHp); }
    if (newAura !== recipient.currentAura) { statUpdates.currentAura = newAura; fireStatPopup(recipient.combatId || '', 'aura', newAura - recipient.currentAura); }
    if (newAmmo !== (recipient.currentAmmo ?? 0)) { statUpdates.currentAmmo = newAmmo; fireStatPopup(recipient.combatId || '', 'ammo', newAmmo - (recipient.currentAmmo ?? 0)); }
    if (Object.keys(statUpdates).length > 0) updateCharacterStats(recipientId, statUpdates);

    if (item.combatConditionEffect) {
      const newConditions = [...(recipient.conditions || []), { name: item.combatConditionEffect, duration: item.combatConditionDuration ?? 3 }];
      updateCharacterStats(recipientId, { conditions: newConditions });
    }
  };

  // Resolve a pending item action after dice roll (called when diceAnim completes)
  const resolvePendingItemAction = () => {
    if (!pendingItemAction || !combat) { setPendingItemAction(null); return; }
    const { actor, item, targetId, targeting } = pendingItemAction;
    setPendingItemAction(null);
    const roll = rollDice(item.combatDiceRoll || '1d20', 0);
    const dc = item.combatDc ?? 0;
    const isSuccess = dc === 0 || roll.total >= dc;

    // Show dice animation
    setDiceAnim({
      isVisible: true,
      result: roll.total,
      isSuccess,
      customLabel: isSuccess ? 'ACERTOU!' : 'FALHOU!',
      notation: item.combatDiceRoll || '1d20',
      individualRolls: roll.individualRolls,
      numSides: roll.numSides,
      bonus: roll.bonus,
    });

    if (!isSuccess) return; // Effects only apply on success

    if (targeting === 'area') {
      // Ammo cost and consume once
      if ((item.combatAmmoCost ?? 0) > 0 && (actor.maxAmmo ?? 0) > 0) {
        const newAmmoActor = Math.max(0, (actor.currentAmmo ?? 0) - item.combatAmmoCost);
        updateCharacterStats(actor.id, { currentAmmo: newAmmoActor });
      }
      if (item.consumeOnUse) {
        const char = characters.find((c: any) => c.id === actor.id);
        if (char) {
          const updatedItems = char.items.map((it: Item) => it.id !== item.id ? it : { ...it, quantity: Math.max(0, (it.quantity ?? 1) - 1) });
          updateCharacterStats(actor.id, { items: updatedItems });
        }
      }
      combat.combatants.forEach((c: any) => {
        let newHp = c.currentHp, newAura = c.currentAura;
        let diceBonus = 0;
        if (item.combatDiceRoll) { try { diceBonus = rollDice(item.combatDiceRoll, 0).total; } catch {} }
        if ((item.combatHeal ?? 0) > 0) newHp = Math.min(c.maxHp, newHp + item.combatHeal + diceBonus);
        else if ((item.combatDamage ?? 0) > 0) newHp = Math.max(0, newHp - item.combatDamage - diceBonus);
        if ((item.combatAuraRecover ?? 0) > 0) newAura = Math.min(c.maxAura, newAura + item.combatAuraRecover);
        const upd: Partial<Character> = {};
        if (newHp !== c.currentHp) { upd.currentHp = newHp; fireStatPopup(c.combatId, 'hp', newHp - c.currentHp); }
        if (newAura !== c.currentAura) { upd.currentAura = newAura; fireStatPopup(c.combatId, 'aura', newAura - c.currentAura); }
        if (Object.keys(upd).length > 0) updateCharacterStats(c.id, upd);
        if (item.combatConditionEffect) updateCharacterStats(c.id, { conditions: [...(c.conditions||[]), { name: item.combatConditionEffect, duration: item.combatConditionDuration ?? 3 }] });
      });
    } else {
      // self or specific target
      const targetCombatant = targetId ? combat.combatants.find((c: any) => c.combatId === targetId) : null;
      applyItemEffects(actor, item, targetCombatant ?? undefined);
    }
  };

  const handleUseItem = (actor: any, item: any, preSelectedTargetId?: string) => {
    if (!combat) return;
    const targeting = item.combatTargeting ?? 'self';

    if (targeting === 'other' || targeting === 'choice') {
      if (!preSelectedTargetId) {
        // Show target picker — reuse selectingTargetFor mechanism with item marker
        setItemTargetPickerItem({ actor, item });
        setActiveCommand(null);
        return;
      }
    }

    // If item has a dice roll (with or without DC), show dice animation first, then apply effects
    if (item.combatDiceRoll || (item.combatDc && item.combatDc > 0)) {
      const roll = rollDice(item.combatDiceRoll || '1d20', 0);
      const dc = item.combatDc ?? 0;
      const isSuccess = dc === 0 || roll.total >= dc;
      setDiceAnim({
        isVisible: true,
        result: roll.total,
        isSuccess,
        customLabel: dc > 0 ? (isSuccess ? 'ACERTOU! CD' + dc : 'FALHOU! CD' + dc) : item.name,
        notation: item.combatDiceRoll || '1d20',
        individualRolls: roll.individualRolls,
        numSides: roll.numSides,
        bonus: roll.bonus,
      });

      if (!isSuccess) {
        // Consume item even on failure if set
        if (item.consumeOnUse) {
          const char = characters.find((c: any) => c.id === actor.id);
          if (char) {
            const updatedItems = char.items.map((it: Item) => it.id !== item.id ? it : { ...it, quantity: Math.max(0, (it.quantity ?? 1) - 1) });
            updateCharacterStats(actor.id, { items: updatedItems });
          }
        }
        setActiveCommand(null);
        return;
      }

      // Apply effects (success)
      if (targeting === 'area') {
        if ((item.combatAmmoCost ?? 0) > 0 && (actor.maxAmmo ?? 0) > 0) {
          const newAmmoActor = Math.max(0, (actor.currentAmmo ?? 0) - item.combatAmmoCost);
          updateCharacterStats(actor.id, { currentAmmo: newAmmoActor });
        }
        if (item.consumeOnUse) {
          const char = characters.find((c: any) => c.id === actor.id);
          if (char) {
            const updatedItems = char.items.map((it: Item) => it.id !== item.id ? it : { ...it, quantity: Math.max(0, (it.quantity ?? 1) - 1) });
            updateCharacterStats(actor.id, { items: updatedItems });
          }
        }
        let diceBonus = 0;
        if (item.combatDiceRoll) { try { diceBonus = rollDice(item.combatDiceRoll, 0).total; } catch {} }
        combat.combatants.forEach((c: any) => {
          let newHp = c.currentHp, newAura = c.currentAura;
          if ((item.combatHeal ?? 0) > 0) newHp = Math.min(c.maxHp, newHp + item.combatHeal + diceBonus);
          else if ((item.combatDamage ?? 0) > 0) newHp = Math.max(0, newHp - item.combatDamage - diceBonus);
          if ((item.combatAuraRecover ?? 0) > 0) newAura = Math.min(c.maxAura, newAura + item.combatAuraRecover);
          const upd: Partial<Character> = {};
          if (newHp !== c.currentHp) { upd.currentHp = newHp; fireStatPopup(c.combatId, 'hp', newHp - c.currentHp); }
          if (newAura !== c.currentAura) { upd.currentAura = newAura; fireStatPopup(c.combatId, 'aura', newAura - c.currentAura); }
          if (Object.keys(upd).length > 0) updateCharacterStats(c.id, upd);
          if (item.combatConditionEffect) updateCharacterStats(c.id, { conditions: [...(c.conditions||[]), { name: item.combatConditionEffect, duration: item.combatConditionDuration ?? 3 }] });
        });
      } else {
        const targetCombatant = preSelectedTargetId ? combat.combatants.find((c: any) => c.combatId === preSelectedTargetId) : null;
        applyItemEffects(actor, item, targetCombatant ?? undefined);
      }
      setActiveCommand(null);
      return;
    }

    // No dice roll - apply effects immediately
    if (targeting === 'area') {
      if ((item.combatAmmoCost ?? 0) > 0 && (actor.maxAmmo ?? 0) > 0) {
        const newAmmoActor = Math.max(0, (actor.currentAmmo ?? 0) - item.combatAmmoCost);
        updateCharacterStats(actor.id, { currentAmmo: newAmmoActor });
      }
      if (item.consumeOnUse) {
        const char = characters.find((c: any) => c.id === actor.id);
        if (char) {
          const updatedItems = char.items.map((it: Item) => it.id !== item.id ? it : { ...it, quantity: Math.max(0, (it.quantity ?? 1) - 1) });
          updateCharacterStats(actor.id, { items: updatedItems });
        }
      }
      combat.combatants.forEach((c: any) => {
        let newHp = c.currentHp, newAura = c.currentAura;
        if ((item.combatHeal ?? 0) > 0) { newHp = Math.min(c.maxHp, newHp + item.combatHeal); fireStatPopup(c.combatId, 'hp', item.combatHeal); }
        else if ((item.combatDamage ?? 0) > 0) { newHp = Math.max(0, newHp - item.combatDamage); fireStatPopup(c.combatId, 'hp', -item.combatDamage); }
        if ((item.combatAuraRecover ?? 0) > 0) { newAura = Math.min(c.maxAura, newAura + item.combatAuraRecover); fireStatPopup(c.combatId, 'aura', item.combatAuraRecover); }
        const upd: Partial<Character> = {};
        if (newHp !== c.currentHp) upd.currentHp = newHp;
        if (newAura !== c.currentAura) upd.currentAura = newAura;
        if (Object.keys(upd).length > 0) updateCharacterStats(c.id, upd);
        if (item.combatConditionEffect) updateCharacterStats(c.id, { conditions: [...(c.conditions||[]), { name: item.combatConditionEffect, duration: item.combatConditionDuration ?? 3 }] });
      });
      setActiveCommand(null);
      return;
    }

    // self or targeted (no dice)
    const targetCombatant = preSelectedTargetId ? combat.combatants.find((c: any) => c.combatId === preSelectedTargetId) : null;
    applyItemEffects(actor, item, targetCombatant ?? undefined);
    setActiveCommand(null);
  };


  // ─── Execute Seal ────────────────────────────────────────────
  const executeSeal = (seal: Seal, actorCombatId: string, participantIds: string[]) => {
    if (!combat) return;
    const actor = combat.combatants.find(c => c.combatId === actorCombatId);
    if (!actor) return;

    // Apply costs
    const cost = seal.cost || {};
    let newHp = actor.currentHp - (cost.hp ?? 0);
    let newAura = actor.currentAura - (cost.aura ?? 0);
    let newAmmo = (actor.currentAmmo ?? 0) - (cost.ammo ?? 0);
    updateCharacterStats(actor.id, {
      currentHp: Math.max(0, newHp),
      currentAura: Math.max(0, newAura),
      ...(actor.maxAmmo > 0 ? { currentAmmo: Math.max(0, newAmmo) } : {}),
    });

    // Roll dice
    const roll = rollDice(seal.diceRoll || '1d20', 0);
    const dc = seal.dc ?? 0;
    const isSuccess = dc === 0 || roll.total >= dc;

    // Show dice animation
    setDiceAnim({
      isVisible: true,
      result: roll.total,
      isSuccess: isSuccess,
      customLabel: dc > 0 ? (isSuccess ? `ACERTOU! CD${dc}` : `FALHOU! CD${dc}`) : seal.name,
      showSuccessFailure: dc > 0,
    });

    if (!isSuccess) return;

    // Trigger ritual animation
    const ritualEffects: string[] = [];
    if ((seal.damage ?? 0) > 0) ritualEffects.push(`⚔ ${seal.damage} de dano`);
    if ((seal.healHp ?? 0) > 0) ritualEffects.push(`💚 +${seal.healHp} HP`);
    if ((seal.healAura ?? 0) > 0) ritualEffects.push(`⚡ +${seal.healAura} Aura`);
    if (seal.conditionEffect) ritualEffects.push(`✦ ${seal.conditionEffect}`);
    setSealRitualAnim({ seal, effects: ritualEffects });

    // Apply effects to participants
    const allTargetIds = participantIds.length > 0 ? participantIds : [actorCombatId];
    const newCombatants = combat.combatants.map(c => {
      if (!allTargetIds.includes(c.combatId) && c.combatId !== actorCombatId) return c;
      const isSelf = c.combatId === actorCombatId;
      let hp = c.currentHp;
      // Damage goes to enemies; heal goes to self/participants
      if (isSelf || participantIds.includes(c.combatId)) {
        if ((seal.healHp ?? 0) > 0) {
          hp = Math.min(c.maxHp, hp + seal.healHp!);
          fireStatPopup(c.combatId, 'hp', seal.healHp!);
        }
      }
      let aura = c.currentAura;
      if (isSelf && (seal.healAura ?? 0) > 0) {
        aura = Math.min(c.maxAura, aura + seal.healAura!);
        fireStatPopup(c.combatId, 'aura', seal.healAura!);
      }
      // Add condition
      const conds = [...(c.conditions || [])];
      if (seal.conditionEffect && isSelf) {
        conds.push({ name: seal.conditionEffect, duration: seal.conditionDuration ?? 3 });
      }
      return { ...c, currentHp: hp, currentAura: aura, conditions: conds };
    });

    const updatedCombat = { ...combat, combatants: newCombatants };
    DatabaseService.updateCombat(updatedCombat);
    setCombat(updatedCombat);

    // Damage seal: select target
    if ((seal.damage ?? 0) > 0) {
      const dmgCard: any = {
        id: `seal_${seal.id}`,
        name: seal.name,
        type: 'ataque',
        diceRoll: seal.diceRoll || '1d20',
        damage: seal.damage,
        dc: seal.dc,
        description: seal.description,
        image: seal.image,
        auraCost: 0,
        __isSeal: true,
      };
      setSelectingTargetFor(dmgCard);
    }

    // History
    const histItem: any = {
      id: Math.random().toString(36).substr(2, 9),
      round: combat.round,
      actor: actor.name,
      cardName: `🔯 ${seal.name}`,
      roll: roll.total,
      dc,
      isSuccess,
      timestamp: Date.now(),
    };
    const updatedWithHistory = { ...updatedCombat, history: [histItem, ...updatedCombat.history] };
    DatabaseService.updateCombat(updatedWithHistory);
    setCombat(updatedWithHistory);
  };
  const saveCard = (card: Card) => {
    const finalCard = card.id ? card : { ...card, id: Math.random().toString(36).substr(2, 9) };
    DatabaseService.saveCard(finalCard);
  };

  const saveSeal = (seal: Seal) => {
    const finalSeal = seal.id ? seal : { ...seal, id: Math.random().toString(36).substr(2, 9) };
    if (!finalSeal.code) finalSeal.code = finalSeal.id.slice(0, 6).toUpperCase();
    setSeals(prev => {
      const exists = prev.find(s => s.id === finalSeal.id);
      return exists ? prev.map(s => s.id === finalSeal.id ? finalSeal : s) : [...prev, finalSeal];
    });
    DatabaseService.saveSeal(finalSeal);
  };

  const deleteSeal = async (id: string) => {
    setConfirmModal({
      title: "Excluir Selo",
      message: "Tem certeza que deseja excluir este selo permanentemente?",
      onConfirm: async () => {
        setSeals(prev => prev.filter(s => s.id !== id));
        setEditingSeal(null);
        setConfirmModal(null);
        await DatabaseService.deleteSeal(id);
      }
    });
  };

  const deleteCard = async (id: string) => {
    setConfirmModal({
      message: "Deseja excluir esta habilidade permanentemente?",
      onConfirm: async () => {
        setCards(prev => prev.filter(c => c.id !== id));
        setEditingCard(null);
        setConfirmModal(null);
        try {
          await DatabaseService.deleteCard(id);
        } catch (err) {
          console.error("Erro ao deletar habilidade:", err);
        }
      }
    });
  };

  const updateCombat = (newState: CombatState) => {
    DatabaseService.updateCombat(newState);
  };

  const adjustCombatantStat = (combatId: string, stat: 'hp' | 'aura' | 'ammo', delta: number) => {
    if (!combat) return;
    const idx = combat.combatants.findIndex(c => c.combatId === combatId);
    if (idx === -1) return;
    const c = combat.combatants[idx];
    let newVal: number;
    if (stat === 'hp')   newVal = Math.max(0, Math.min(c.maxHp, c.currentHp + delta));
    else if (stat === 'aura') newVal = Math.max(0, Math.min(c.maxAura, c.currentAura + delta));
    else newVal = Math.max(0, Math.min(c.maxAmmo ?? 0, (c.currentAmmo ?? 0) + delta));
    const realDelta = stat === 'hp' ? newVal - c.currentHp
                    : stat === 'aura' ? newVal - c.currentAura
                    : newVal - (c.currentAmmo ?? 0);
    if (realDelta === 0) return;
    const pid = Math.random().toString(36).substr(2, 9);
    const popup = { id: pid, combatId, type: stat, delta: realDelta };
    setStatPopups(prev => [...prev, popup]);
    setTimeout(() => setStatPopups(prev => prev.filter(p => p.id !== pid)), 1800);
    const updated = combat.combatants.map((cb, i) => {
      if (i !== idx) return cb;
      if (stat === 'hp')   return { ...cb, currentHp: newVal };
      if (stat === 'aura') return { ...cb, currentAura: newVal };
      return { ...cb, currentAmmo: newVal };
    });
    DatabaseService.updateCombat({ ...combat, combatants: updated });
  };

  const startCombat = () => {
    if (!combat) return;
    updateCombat({ ...combat, isActive: true, round: 1, turnIndex: 0 });
    setTurnChangeKey(k => k + 1);
    setTurnFlashing(true);
    setTimeout(() => setTurnFlashing(false), 700);
  };

  // Field Condition Handlers
  const removeFieldCondition = (id: string) => {
    if (!combat) return;
    updateCombat({ 
      ...combat, 
      fieldConditions: combat.fieldConditions.filter(f => f.id !== id) 
    });
  };

  const updateFieldCondition = (id: string, newDuration: number) => {
    if (!combat) return;
    if (newDuration <= 0) {
      removeFieldCondition(id);
    } else {
      updateCombat({
        ...combat,
        fieldConditions: combat.fieldConditions.map(f => f.id === id ? { ...f, duration: newDuration } : f)
      });
    }
  };

  const endTurn = () => {
    if (!combat) return;
    
    // Reset command selector on turn change
    setActiveCommand(null);
    setCommandShowAll(false);
    setCommandShowAllSearch('');
    
    // Mark current actor as having acted
    if (currentActor) {
      setActedCombatantIds(prev => new Set([...prev, currentActor.combatId]));
    }
    
    let nextIndex = combat.turnIndex;
    let nextRound = combat.round;
    let newCombatants = [...combat.combatants];
    let newFieldConditions = [...combat.fieldConditions];
    let attempts = 0;
    const maxAttempts = newCombatants.length * 2;
    const expiryNotifs: string[] = [];

    do {
        nextIndex++;
        if (nextIndex >= newCombatants.length) {
          nextIndex = 0;
          nextRound += 1;
          setActedCombatantIds(new Set()); // Reset acted set on new round
          // Collect expiring conditions before decrement
          newCombatants.forEach(c => {
            c.conditions.forEach(cond => {
              if (cond.duration === 1) expiryNotifs.push(`${cond.name} (${c.name}) expirou!`);
            });
          });
          newFieldConditions.forEach(f => {
            if (f.duration === 1) expiryNotifs.push(`Campo: ${f.name} expirou!`);
          });
          // Apply condition effects BEFORE decrementing (effects fire while condition is still active)
          newCombatants = newCombatants.map(c => {
            // Build a merged map of condition effects from all cards that the character owns
            const effectMap: ConditionEffectMap = {};
            const charCards = cards.filter(card => c.cardIds?.includes(card.id) && card.conditionEffects);
            charCards.forEach(card => {
              if (card.conditionEffects) {
                Object.entries(card.conditionEffects).forEach(([condName, effects]) => {
                  if (!effectMap[condName]) effectMap[condName] = [];
                  effectMap[condName].push(...effects);
                });
              }
            });
            // Also include conditionEffects stored directly on the character's card list at global level
            cards.forEach(card => {
              if (card.conditionEffects) {
                Object.entries(card.conditionEffects).forEach(([condName, effects]) => {
                  if (!effectMap[condName]) effectMap[condName] = [];
                  // Only add if not already from char cards
                  if (!c.cardIds?.includes(card.id)) return;
                  // already handled above
                });
              }
            });

            let newHp = c.currentHp;
            let newAura = c.currentAura;
            let newAmmo = c.currentAmmo ?? 0;
            const condEffectNotifs: string[] = [];

            c.conditions.forEach(cond => {
              let effects = effectMap[cond.name];
              // Fallback: auto-apply preset condition effects if no custom effectMap is set
              if (!effects || effects.length === 0) {
                const preset = PRESET_CONDITIONS.find(p => p.name === cond.name);
                if (preset && preset.defaultValue !== undefined) {
                  // Only apply damage/heal presets automatically (not paralysis, sleep, etc.)
                  if (['Queimando','Eletrocutado','Envenenado','Sangrando'].includes(cond.name)) {
                    effects = [{ type: 'damage', value: preset.defaultValue }];
                  } else if (cond.name === 'Regenerando') {
                    effects = [{ type: 'heal', value: preset.defaultValue }];
                  }
                }
              }
              if (!effects || effects.length === 0) return;
              effects.forEach(eff => {
                let val = eff.value;
                if (eff.diceRoll) {
                  try { val = rollDice(eff.diceRoll, 0).total; } catch {}
                }
                switch (eff.type) {
                  case 'damage':     newHp   = Math.max(0, newHp - val);   condEffectNotifs.push(`${c.name}: ${cond.name} causou -${val}♥`); break;
                  case 'heal':       newHp   = Math.min(c.maxHp, newHp + val); condEffectNotifs.push(`${c.name}: ${cond.name} curou +${val}♥`); break;
                  case 'drainAura':  newAura = Math.max(0, newAura - val); condEffectNotifs.push(`${c.name}: ${cond.name} drenou -${val}⚡`); break;
                  case 'recoverAura':newAura = Math.min(c.maxAura, newAura + val); condEffectNotifs.push(`${c.name}: ${cond.name} recuperou +${val}⚡`); break;
                  case 'drainAmmo':  newAmmo = Math.max(0, newAmmo - val); break;
                  case 'recoverAmmo':newAmmo = Math.min(c.maxAmmo ?? 0, newAmmo + val); break;
                  default: break;
                }
              });
            });

            if (condEffectNotifs.length > 0) expiryNotifs.push(...condEffectNotifs);

            // Persist to character DB
            if (newHp !== c.currentHp || newAura !== c.currentAura || newAmmo !== (c.currentAmmo ?? 0)) {
              const upd: Partial<Character> = {};
              if (newHp !== c.currentHp)                  upd.currentHp   = newHp;
              if (newAura !== c.currentAura)              upd.currentAura = newAura;
              if (newAmmo !== (c.currentAmmo ?? 0))       upd.currentAmmo = newAmmo;
              updateCharacterStats(c.id, upd);
            }

            return { ...c, currentHp: newHp, currentAura: newAura, currentAmmo: newAmmo };
          });

          // Decrement conditions
          newCombatants = newCombatants.map(c => ({
            ...c,
            conditions: c.conditions.map(cond => ({ ...cond, duration: cond.duration - 1 })).filter(cond => cond.duration > 0)
          }));
          newFieldConditions = newFieldConditions.map(f => ({ ...f, duration: f.duration - 1 })).filter(f => f.duration > 0);
        }
        attempts++;
    } while (newCombatants[nextIndex].currentHp <= 0 && attempts < maxAttempts);

    // Decrement forma durations (only at round end, which was tracked above via nextRound)
    let newActiveForms = [...(combat.activeForms || [])];
    const roundAdvanced = nextRound > combat.round;
    if (roundAdvanced) {
      const expiredForms: ActiveForma[] = [];
      newActiveForms = newActiveForms.map(f => {
        if (!f.duration || f.duration <= 0) return f; // 0 = permanent
        const newDuration = f.duration - 1;
        if (newDuration <= 0) { expiredForms.push(f); return { ...f, duration: 0 }; }
        return { ...f, duration: newDuration };
      });
      // Revert stat bonuses for expired formas
      expiredForms.forEach(ef => {
        const cIdx = newCombatants.findIndex(c => c.combatId === ef.combatantId);
        if (cIdx !== -1 && (ef.hpBonus || ef.auraBonus)) {
          const hpBonus = ef.hpBonus || 0;
          const auraBonus = ef.auraBonus || 0;
          const newMaxHp = Math.max(1, newCombatants[cIdx].maxHp - hpBonus);
          const newMaxAura = Math.max(0, newCombatants[cIdx].maxAura - auraBonus);
          newCombatants[cIdx] = { ...newCombatants[cIdx], maxHp: newMaxHp, maxAura: newMaxAura, currentHp: Math.min(newCombatants[cIdx].currentHp, newMaxHp), currentAura: Math.min(newCombatants[cIdx].currentAura, newMaxAura) };
        }
        expiryNotifs.push(`Forma de ${newCombatants.find(c=>c.combatId===ef.combatantId)?.name||'?'} expirou!`);
      });
      newActiveForms = newActiveForms.filter(f => !f.duration || f.duration > 0 || expiredForms.every(ef => ef.combatantId !== f.combatantId || ef.cardId !== f.cardId));
    }

    if (attempts >= maxAttempts) {
        nextIndex = 0; 
    }

    // Show condition expiry notifications
    if (expiryNotifs.length > 0) {
      setConditionExpiryNotifs(expiryNotifs);
      setTimeout(() => setConditionExpiryNotifs([]), 4000);
    }

    const nextActor = newCombatants[nextIndex];
    if (nextActor) {
      setTurnBanner({ name: nextActor.name, icon: nextActor.icon || '' });
      setTimeout(() => setTurnBanner(null), 2800);
    }
    updateCombat({ ...combat, turnIndex: nextIndex, round: nextRound, combatants: newCombatants, fieldConditions: newFieldConditions, activeForms: newActiveForms });
    setSelectedCombatantId(null);
    setSelectingTargetFor(null);
    // Trigger turn-change animation
    setTurnChangeKey(k => k + 1);
    setTurnFlashing(true);
    setTimeout(() => setTurnFlashing(false), 700);
  };

  const handleGridClick = (x: number, y: number) => {
    if (!combat) return;

    // Placing a custom pin
    if (placingPin) {
      const newPin: CustomPin = {
        id: Math.random().toString(36).substr(2, 9),
        label: placingPin.label,
        color: placingPin.color,
        gridPos: { x, y },
      };
      updateCombat({ ...combat, customPins: [...(combat.customPins || []), newPin] });
      setPlacingPin(null);
      return;
    }

    if (selectingTargetFor) {
        const target = combat.combatants.find(c => c.gridPos.x === x && c.gridPos.y === y);
        if (target) {
            if (selectingTargetFor.isAreaEffect) {
              // Toggle target in/out of area selection
              setAreaSelectedTargets(prev =>
                prev.includes(target.combatId)
                  ? prev.filter(id => id !== target.combatId)
                  : [...prev, target.combatId]
              );
            } else {
              executeCardOnTarget(selectingTargetFor, 'other', target.combatId);
            }
        } else if (!selectingTargetFor.isAreaEffect) {
            setSelectingTargetFor(null);
        }
        return;
    }

    const clicked = combat.combatants.find(c => c.gridPos.x === x && c.gridPos.y === y);
    if (clicked) {
      setSelectedCombatantId(clicked.combatId);
    } else if (selectedCombatantId) {
      // Check if this combatant is in a union — move all union members together
      const unions = combat.unions || [];
      const memberUnion = unions.find(u => u.combatantIds.includes(selectedCombatantId));
      if (memberUnion) {
        // Calculate delta from selected combatant's current position
        const leader = combat.combatants.find(c => c.combatId === selectedCombatantId);
        if (leader) {
          const dx = x - leader.gridPos.x;
          const dy = y - leader.gridPos.y;
          const gw = combat.gridWidth || 10;
          const gh = combat.gridHeight || 10;
          const newCombatants = combat.combatants.map(c => {
            if (memberUnion.combatantIds.includes(c.combatId)) {
              return { ...c, gridPos: { x: Math.max(0, Math.min(gw-1, c.gridPos.x + dx)), y: Math.max(0, Math.min(gh-1, c.gridPos.y + dy)) } };
            }
            return c;
          });
          updateCombat({ ...combat, combatants: newCombatants });
          setSelectedCombatantId(null);
        }
      } else {
        const newCombatants = combat.combatants.map(c => c.combatId === selectedCombatantId ? { ...c, gridPos: { x, y } } : c);
        updateCombat({ ...combat, combatants: newCombatants });
        setSelectedCombatantId(null);
      }
    }
  };

  // ── GRID DRAG HANDLERS ──────────────────────────────────────────
  const handleGridDragStart = (combatId: string) => {
    if (!combat) return;
    setGridDragCombatId(combatId);
    setSelectedCombatantId(combatId);
    setGridSnapPreview(null);
  };

  const handleGridDragOverCell = (x: number, y: number) => {
    setGridDragOverCell({ x, y });
    if (gridDragCombatId) {
      setGridSnapPreview({ combatId: gridDragCombatId, x, y });
    }
  };

  const handleGridDrop = (x: number, y: number) => {
    if (!combat || !gridDragCombatId) { setGridDragCombatId(null); setGridDragOverCell(null); setGridSnapPreview(null); return; }

    const dragged = combat.combatants.find(c => c.combatId === gridDragCombatId);
    if (!dragged) { setGridDragCombatId(null); setGridDragOverCell(null); setGridSnapPreview(null); return; }

    const from = dragged.gridPos;
    const dx = Math.abs(x - from.x);
    const dy = Math.abs(y - from.y);
    const squares = dx + dy; // Manhattan distance

    const unions = combat.unions || [];
    const memberUnion = unions.find(u => u.combatantIds.includes(gridDragCombatId));
    let newCombatants;

    if (memberUnion) {
      const diffX = x - from.x;
      const diffY = y - from.y;
      const gw = combat.gridWidth || 10;
      const gh = combat.gridHeight || 10;
      newCombatants = combat.combatants.map(c =>
        memberUnion.combatantIds.includes(c.combatId)
          ? { ...c, gridPos: { x: Math.max(0, Math.min(gw-1, c.gridPos.x + diffX)), y: Math.max(0, Math.min(gh-1, c.gridPos.y + diffY)) } }
          : c
      );
    } else {
      newCombatants = combat.combatants.map(c => c.combatId === gridDragCombatId ? { ...c, gridPos: { x, y } } : c);
    }

    updateCombat({ ...combat, combatants: newCombatants });

    // Record move history
    if (squares > 0) {
      setGridMoveHistory(prev => ({ ...prev, [gridDragCombatId]: { from, squares } }));
      // Clear move history after 4 seconds
      setTimeout(() => setGridMoveHistory(prev => { const n = {...prev}; delete n[gridDragCombatId!]; return n; }), 4000);
    }

    setGridDragCombatId(null);
    setGridDragOverCell(null);
    setGridSnapPreview(null);
    setSelectedCombatantId(null);
  };

  const handleGridDragEnd = () => {
    setGridDragCombatId(null);
    setGridDragOverCell(null);
    setGridSnapPreview(null);
  };

  const handleInitiativeStripClick = (combatId: string) => {
    if (!combat) return;
    if (selectingTargetFor) {
      const target = combat.combatants.find(c => c.combatId === combatId);
      if (target) {
        if (selectingTargetFor.isAreaEffect) {
          setAreaSelectedTargets(prev =>
            prev.includes(combatId)
              ? prev.filter(id => id !== combatId)
              : [...prev, combatId]
          );
        } else {
          executeCardOnTarget(selectingTargetFor, 'other', target.combatId);
        }
      }
      return;
    }
    // Union selection mode
    if (unionMode) {
      setUnionSelecting(prev => prev.includes(combatId) ? prev.filter(id => id !== combatId) : [...prev, combatId]);
      return;
    }
    setSelectedCombatantId(prev => prev === combatId ? null : combatId);
  };

  const createUnion = () => {
    if (!combat || unionSelecting.length < 2) return;
    const newUnion: CombatantUnion = {
      id: Math.random().toString(36).substr(2, 9),
      combatantIds: [...unionSelecting],
      color: unionColor,
    };
    // Move all to same position as first member
    const leader = combat.combatants.find(c => c.combatId === unionSelecting[0]);
    if (!leader) return;
    const newCombatants = combat.combatants.map(c =>
      unionSelecting.includes(c.combatId) ? { ...c, gridPos: { ...leader.gridPos } } : c
    );
    updateCombat({ ...combat, unions: [...(combat.unions || []), newUnion], combatants: newCombatants });
    setUnionSelecting([]);
    setUnionMode(false);
  };

  const breakUnion = (unionId: string) => {
    if (!combat) return;
    updateCombat({ ...combat, unions: (combat.unions || []).filter(u => u.id !== unionId) });
  };

  const initiateCardUsage = (card: Card) => {
    if (!combat) return;
    // Show zoom animation first
    setZoomedCardLevel(1);
    setZoomedCard(card);
  };

  const confirmCardUsage = (card: Card, levelOverride?: number) => {
    setZoomedCard(null);
    // Apply level overrides to the card we'll actually use
    let effectiveCard = card;
    const lvlNum = levelOverride ?? zoomedCardLevel;
    if (lvlNum > 1 && card.levels && card.levels.length >= lvlNum - 1) {
      const lvData = card.levels[lvlNum - 2];
      effectiveCard = {
        ...card,
        name: lvData.name || card.name,
        auraCost: lvData.auraCost ?? card.auraCost,
        ammoCost: lvData.ammoCost ?? card.ammoCost,
        diceRoll: lvData.diceRoll || card.diceRoll,
        damage: lvData.damage ?? card.damage,
        dc: lvData.dc ?? card.dc,
        conditionEffect: lvData.conditionEffect ?? card.conditionEffect,
        conditionDuration: lvData.conditionDuration ?? card.conditionDuration,
        description: lvData.description || card.description,
      };
    }
    if (effectiveCard.type === 'combinação') {
      // Enter combo selection mode
      if (!currentActor) return;
      setComboCard(effectiveCard);
      setComboParticipants([currentActor.combatId]);
      return;
    }
    if (effectiveCard.type === 'forma') {
      // Activate forma: trigger animation then apply forma effects
      if (!currentActor) return;
      setFormaAnimCard(effectiveCard);
      setFormaAnimCombatantId(currentActor.combatId);
      // After animation delay, apply forma effect
      setTimeout(() => {
        executeFormaCard(effectiveCard, currentActor.combatId);
        setFormaAnimCard(null);
        setFormaAnimCombatantId(null);
      }, 1900);
      return;
    }
    if (effectiveCard.isAreaEffect) {
      setAreaSelectedTargets([]);
      setSelectingTargetFor(effectiveCard);
    } else {
      setSelectingTargetFor(effectiveCard);
    }
  };

  const executeCardOnTarget = (card: Card, targetType: 'self' | 'area' | 'other', targetId?: string, multiTargetIds?: string[]) => {
    if (!combat || !currentActor) return;
    setSelectingTargetFor(null);
    setAreaSelectedTargets([]);

    // Handle combo card
    const comboParticipantsArr = (card as any)._comboParticipants as string[] | undefined;
    if (card.type === 'combinação' && comboParticipantsArr) {
      const targetCombatId = targetType === 'self' ? currentActor.combatId : targetId;
      executeComboCard(card, comboParticipantsArr, targetCombatId);
      return;
    }

    const actorIdx = combat.combatants.findIndex(c => c.combatId === currentActor.combatId);
    const newCombatants = [...combat.combatants];
    
    // Calcula novo custo de aura
    const newAura = Math.max(0, newCombatants[actorIdx].currentAura - card.auraCost);
    newCombatants[actorIdx].currentAura = newAura;

    // Deduct ammo if card costs ammo
    const ammoCost = card.ammoCost || 0;
    if (ammoCost > 0 && newCombatants[actorIdx].maxAmmo > 0) {
      const newAmmo = Math.max(0, (newCombatants[actorIdx].currentAmmo || 0) - ammoCost);
      newCombatants[actorIdx].currentAmmo = newAmmo;
      updateCharacterStats(newCombatants[actorIdx].id, { currentAmmo: newAmmo });
    }

    // SINCRONIZAÇÃO: Atualiza o personagem original com a nova Aura
    updateCharacterStats(newCombatants[actorIdx].id, { currentAura: newAura });

    if (targetType === 'area') {
      const roll = rollDice(card.diceRoll, combat.globalBonus);
      // Gather affected targets for animation
      const affectedTargets = multiTargetIds && multiTargetIds.length > 0
        ? multiTargetIds.map(id => combat.combatants.find(c => c.combatId === id)).filter(Boolean)
        : combat.combatants;

      // Show card reveal animation for area cards
      setCardAnim({
        attackCard: { name: card.name, image: card.image, type: card.type, auraCost: card.auraCost, diceRoll: card.diceRoll, damage: card.damage, conditionEffect: card.conditionEffect, element: (card as any).element },
        attacker: { name: currentActor.name, icon: currentActor.icon },
        areaTargets: (affectedTargets as Combatant[]).map(t => ({ name: t.name, icon: t.icon })),
        attackRoll: { total: roll.total, notation: roll.notation, individualRolls: roll.individualRolls, numSides: roll.numSides, bonus: roll.bonus },
        isSuccess: true,
        isCrit: roll.individualRolls.length === 1 && roll.numSides >= 4 && roll.individualRolls[0] >= roll.numSides,
        isFumble: false,
      });
      
      const newFieldConditions = [...combat.fieldConditions];
      
      // LOGIC: Only apply condition if no DC or Roll >= DC
      const passedDC = !card.dc || roll.total >= card.dc;
      
      if (card.conditionEffect && passedDC) {
        newFieldConditions.push({
          id: Math.random().toString(36).substr(2, 9),
          name: card.conditionEffect,
          duration: card.conditionDuration || 3,
          sourceCard: card.name
        });
      }

      // Apply damage to each area target if card has damage
      const affectedIds = multiTargetIds && multiTargetIds.length > 0 ? multiTargetIds : combat.combatants.map(c => c.combatId);
      if (card.damage && card.damage > 0 && passedDC) {
        affectedIds.forEach(tid => {
          const tIdx = newCombatants.findIndex(c => c.combatId === tid);
          if (tIdx !== -1) {
            const newHp = Math.max(0, newCombatants[tIdx].currentHp - card.damage!);
            newCombatants[tIdx].currentHp = newHp;
            updateCharacterStats(newCombatants[tIdx].id, { currentHp: newHp });
          }
        });
      }

      updateCombat({
        ...combat,
        combatants: newCombatants,
        fieldConditions: newFieldConditions,
        history: [{
           id: Math.random().toString(36).substr(2, 9),
           round: combat.round, actor: currentActor.name, cardName: card.name,
           roll: roll.total, isSuccess: true, timestamp: Date.now()
        }, ...combat.history]
      });
    } else if (targetId || targetType === 'self') {
      const actualTargetId = targetType === 'self' ? currentActor.combatId : targetId!;
      const target = combat.combatants.find(c => c.combatId === actualTargetId);
      if (!target) return;

      const targetChar = characters.find(c => c.id === target.id);
      
      // Lógica de Reação Atualizada: Encontra TODAS as cartas de reação do alvo
      const availableReactions = targetChar?.cardIds
        .map(id => cards.find(c => c.id === id))
        .filter(c => c && c.type === 'reação') as Card[];

      // Aciona o prompt se houver reações disponíveis e não for auto-alvo
      if (availableReactions && availableReactions.length > 0 && targetType !== 'self') {
        setIsReactionPrompt({ target, availableReactions, attacker: currentActor, activeCard: card });
        return;
      }
      finalizeAction(card, target, currentActor, newCombatants);
    }
  };

  const finalizeAction = (card: Card, target: Combatant, attacker: Combatant, currentCombatants: Combatant[], reactionResult?: number, reactionCardUsed?: Card) => {
    if (!combat) return;

    // Check for active item boost (par/trinca/quadra/reroll)
    const boost = activeCardItemBoost?.charId === attacker.id ? activeCardItemBoost : null;
    let roll = rollDice(card.diceRoll || "1d20", combat.globalBonus);

    if (boost && card.diceRoll) {
      if (['par','trinca','quadra'].includes(boost.itemName)) {
        // Roll extra dice and take best
        const extraRolls = boost.itemName === 'par' ? 1 : boost.itemName === 'trinca' ? 2 : 3;
        let bestRoll = roll;
        for (let i = 0; i < extraRolls; i++) {
          const r = rollDice(card.diceRoll, combat.globalBonus);
          if (r.total > bestRoll.total) bestRoll = r;
        }
        roll = bestRoll;
      }
      // reroll: handled after success check below
    }
    
    let hitsDC = card.dc !== undefined ? roll.total >= card.dc : true;
    const beatsReaction = reactionResult !== undefined ? roll.total > reactionResult : true;
    let isSuccess = hitsDC && beatsReaction;

    // Reroll item: if failure, reroll once
    if (boost?.itemName === 'reroll' && !isSuccess && card.diceRoll) {
      const rerollResult = rollDice(card.diceRoll, combat.globalBonus);
      roll = rerollResult;
      hitsDC = card.dc !== undefined ? roll.total >= card.dc : true;
      isSuccess = hitsDC && (reactionResult !== undefined ? roll.total > reactionResult : true);
    }

    // Consume item boost
    if (boost) {
      const itemName = boost.itemName.charAt(0).toUpperCase() + boost.itemName.slice(1);
      const actorChar = characters.find(c => c.id === attacker.id);
      if (actorChar) {
        const updatedItems = actorChar.items.map(it => {
          if (it.name === itemName && it.category === 'Upgrade') {
            return { ...it, quantity: Math.max(0, (it.quantity ?? 1) - 1) };
          }
          return it;
        }).filter(it => !(it.name === itemName && it.category === 'Upgrade' && (it.quantity ?? 0) <= 0));
        saveCharacter({ ...actorChar, items: updatedItems });
      }
      setActiveCardItemBoost(null);
    }
    // Critical: raw roll equals numSides (all dice sizes), single die only
    const isCrit = roll.individualRolls.length === 1 && roll.numSides >= 4 && roll.individualRolls[0] >= roll.numSides;
    // Fumble: raw roll of 1, single die only
    const isFumble = roll.individualRolls.length === 1 && roll.numSides >= 4 && roll.individualRolls[0] === 1;

    // Build card reveal animation payload
    const animPayload: CardAnimPayload = {
      attackCard: { name: card.name, image: card.image, type: card.type, auraCost: card.auraCost, diceRoll: card.diceRoll, damage: card.damage, conditionEffect: card.conditionEffect, element: (card as any).element },
      attacker: { name: attacker.name, icon: attacker.icon },
      target: { name: target.name, icon: target.icon },
      attackRoll: { total: roll.total, notation: roll.notation, individualRolls: roll.individualRolls, numSides: roll.numSides, bonus: roll.bonus },
      isSuccess, isCrit, isFumble,
    };
    if (reactionResult !== undefined && reactionCardUsed) {
      const reactNotation = reactionCardUsed.diceRoll || "1d20";
      const sidesMatch = reactNotation.match(/\d+d(\d+)/);
      const reactNumSides = sidesMatch ? parseInt(sidesMatch[1]) : 20;
      animPayload.reactionCard = { name: reactionCardUsed.name, image: reactionCardUsed.image, type: reactionCardUsed.type, auraCost: reactionCardUsed.auraCost, diceRoll: reactionCardUsed.diceRoll };
      animPayload.reactionRoll = { total: reactionResult, notation: reactNotation, individualRolls: [reactionResult], numSides: reactNumSides };
    }
    setCardAnim(animPayload);

    if (isSuccess && card.type === 'ataque') {
      setImpactTargetId(target.combatId);
      setTimeout(() => setImpactTargetId(null), 800);
    }

    const newCombatants = [...currentCombatants];
    const targetIdx = newCombatants.findIndex(c => c.combatId === target.combatId);
    let damageDealt = 0;
    
    const critMult = isCrit ? 2 : 1;
    const isSelfTarget = target.combatId === attacker.combatId;

    if (targetIdx !== -1) {
      if (isSuccess && card.type === 'ataque' && card.damage) {
         damageDealt = card.damage * critMult;
         const newHp = Math.max(0, newCombatants[targetIdx].currentHp - damageDealt);
         newCombatants[targetIdx].currentHp = newHp;
         updateCharacterStats(newCombatants[targetIdx].id, { currentHp: newHp });
      }
      
      const passedConditionCheck = !card.dc || roll.total >= card.dc;

      if (card.conditionEffect && passedConditionCheck && beatsReaction) {
        const duration = (card.conditionDuration || 3) * critMult;
        const condIdx = newCombatants[targetIdx].conditions.findIndex(c => c.name === card.conditionEffect);
        if (condIdx === -1) {
          newCombatants[targetIdx].conditions.push({ name: card.conditionEffect, duration });
        } else {
          newCombatants[targetIdx].conditions[condIdx].duration = duration;
        }
        updateCharacterStats(newCombatants[targetIdx].id, { conditions: newCombatants[targetIdx].conditions });
      }
    }

    // ── FUMBLE EFFECTS ──
    if (isFumble) {
      const attackerIdx = newCombatants.findIndex(c => c.combatId === attacker.combatId);
      if (isSelfTarget) {
        // Self-target fumble: attacker takes damage equal to dice size
        const selfDmg = roll.numSides;
        const newHp = Math.max(0, newCombatants[attackerIdx].currentHp - selfDmg);
        newCombatants[attackerIdx].currentHp = newHp;
        updateCharacterStats(newCombatants[attackerIdx].id, { currentHp: newHp });
        fireStatPopup(attacker.combatId, 'hp', -selfDmg);
      } else {
        // Other-target fumble: if target has already acted this round, give them back their turn
        if (actedCombatantIds.has(target.combatId)) {
          // Remove target from acted set so they can act again
          setActedCombatantIds(prev => {
            const next = new Set(prev);
            next.delete(target.combatId);
            return next;
          });
          // Show fumble turn-pass banner
          setTurnBanner({ name: target.name, icon: target.icon || '', isFumbleTurnPass: true });
          setTimeout(() => setTurnBanner(null), 3000);
          // Set combat turnIndex to the target's position
          setTimeout(() => {
            const targetTurnIdx = combat.combatants.findIndex(c => c.combatId === target.combatId);
            if (targetTurnIdx !== -1) {
              updateCombat({ ...combat, combatants: newCombatants, turnIndex: targetTurnIdx });
            }
          }, 200);
        }
      }
    }

    // Apply bonuses for ação/reforço cards (target = the target they're used on), doubled on crit
    let finalCombatants = newCombatants;
    if ((card.type === 'ação' || card.type === 'reforço') && card.bonuses && card.bonuses.length > 0 && isSuccess) {
      // On crit, apply bonuses twice
      finalCombatants = applyCardBonuses(card, [target.combatId], newCombatants);
      if (isCrit) finalCombatants = applyCardBonuses(card, [target.combatId], finalCombatants);
    }

    const historyItem: CombatHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      round: combat.round, actor: attacker.name, target: target.name,
      cardName: card.name, roll: roll.total, dc: card.dc, damageDealt,
      reactionRoll: reactionResult, isSuccess, timestamp: Date.now()
    };

    updateCombat({ ...combat, combatants: finalCombatants, history: [historyItem, ...combat.history] });
  };

  // Resolve a combination card with multiple participants
  const executeComboCard = (card: Card, participantCombatIds: string[], targetId?: string) => {
    if (!combat) return;
    setComboCard(null);
    setComboParticipants([]);
    setSelectingTargetFor(null);

    const newCombatants = [...combat.combatants];

    // Deduct aura from all participants
    participantCombatIds.forEach(cid => {
      const idx = newCombatants.findIndex(c => c.combatId === cid);
      if (idx !== -1) {
        const newAura = Math.max(0, newCombatants[idx].currentAura - card.auraCost);
        newCombatants[idx].currentAura = newAura;
        updateCharacterStats(newCombatants[idx].id, { currentAura: newAura });
      }
    });

    // Mark all participants as having acted
    setActedCombatantIds(prev => new Set([...prev, ...participantCombatIds]));

    // Roll one die per participant using card's dice roll
    const rolls: number[] = participantCombatIds.map(() => {
      const r = rollDice(card.diceRoll || '1d20', 0);
      return r.total;
    });

    const finalRoll = (card.comboDiceMode ?? 'sum') === 'sum'
      ? rolls.reduce((a, b) => a + b, 0)
      : Math.max(...rolls);

    const participants = participantCombatIds.map(cid => combat.combatants.find(c => c.combatId === cid)).filter(Boolean) as Combatant[];
    const target = targetId ? combat.combatants.find(c => c.combatId === targetId) : null;
    const isSuccess = !card.dc || finalRoll >= card.dc;

    // Show combo animation
    setCardAnim({
      attackCard: { name: card.name, image: card.image, type: card.type, auraCost: card.auraCost, diceRoll: card.diceRoll, damage: card.damage, conditionEffect: card.conditionEffect, element: (card as any).element },
      attacker: { name: participants.map(p => p.name).join(' + '), icon: participants[0]?.icon || '' },
      target: target ? { name: target.name, icon: target.icon } : undefined,
      attackRoll: { total: finalRoll, notation: card.diceRoll, individualRolls: rolls, numSides: 20, bonus: 0 },
      isSuccess,
      isCrit: false,
      isFumble: false,
    } as any);

    if (target) {
      const tIdx = newCombatants.findIndex(c => c.combatId === targetId);
      if (tIdx !== -1 && isSuccess && card.damage) {
        const newHp = Math.max(0, newCombatants[tIdx].currentHp - card.damage);
        newCombatants[tIdx].currentHp = newHp;
        updateCharacterStats(newCombatants[tIdx].id, { currentHp: newHp });
      }
      if (tIdx !== -1 && card.conditionEffect && isSuccess) {
        const condIdx = newCombatants[tIdx].conditions.findIndex(c => c.name === card.conditionEffect);
        if (condIdx === -1) newCombatants[tIdx].conditions.push({ name: card.conditionEffect!, duration: card.conditionDuration || 3 });
      }
    }

    // Apply bonuses to target (if target exists) or to all participants
    let finalCombatants = newCombatants;
    if (card.bonuses && card.bonuses.length > 0 && isSuccess) {
      const bonusTargets = target ? [target.combatId] : participantCombatIds;
      finalCombatants = applyCardBonuses(card, bonusTargets, newCombatants);
    }

    updateCombat({
      ...combat,
      combatants: finalCombatants,
      history: [{
        id: Math.random().toString(36).substr(2, 9),
        round: combat.round,
        actor: participants.map(p => p.name).join(' + '),
        target: target?.name,
        cardName: `🔗 ${card.name}`,
        roll: finalRoll,
        dc: card.dc,
        damageDealt: isSuccess && card.damage ? card.damage : 0,
        isSuccess,
        timestamp: Date.now(),
      }, ...combat.history],
    });
  };

  // ── Apply bonus effects from a card (heal HP, recover aura/ammo, roll bonuses) ──
  const applyCardBonuses = (card: Card, targetCombatIds: string[], newCombatants: Combatant[]) => {
    if (!card.bonuses || card.bonuses.length === 0) return newCombatants;
    const updated = [...newCombatants];
    card.bonuses.forEach(bonus => {
      targetCombatIds.forEach(tid => {
        const idx = updated.findIndex(c => c.combatId === tid);
        if (idx === -1) return;
        const c = updated[idx];
        if (bonus.type === 'healHp') {
          const newHp = Math.min(c.maxHp, c.currentHp + bonus.value);
          updated[idx] = { ...c, currentHp: newHp };
          updateCharacterStats(c.id, { currentHp: newHp });
          setStatPopups(prev => [...prev, { id: Math.random().toString(36), combatId: tid, type: 'hp', delta: bonus.value }]);
        } else if (bonus.type === 'recoverAura') {
          const newAura = Math.min(c.maxAura, c.currentAura + bonus.value);
          updated[idx] = { ...c, currentAura: newAura };
          updateCharacterStats(c.id, { currentAura: newAura });
          setStatPopups(prev => [...prev, { id: Math.random().toString(36), combatId: tid, type: 'aura', delta: bonus.value }]);
        } else if (bonus.type === 'recoverAmmo') {
          const newAmmo = Math.min(c.maxAmmo, (c.currentAmmo || 0) + bonus.value);
          updated[idx] = { ...c, currentAmmo: newAmmo };
          updateCharacterStats(c.id, { currentAmmo: newAmmo });
          setStatPopups(prev => [...prev, { id: Math.random().toString(36), combatId: tid, type: 'ammo', delta: bonus.value }]);
        }
        // Note: rollBonus types are tracked in the global bonus or separately; for now show a popup
      });
    });
    return updated;
  };

  // ── Execute burn card (queimar) ─────────────────────────────
  const executeBurnCard = (card: Card, targetIds: string[], effect: 'damage'|'healHp'|'drainAura'|'gainAura', fixedValue: number, level: number) => {
    if (!combat) return;
    const roll = rollDice(card.diceRoll || '1d20', 0);
    const diceVal = roll.total;
    const finalVal = diceVal * Math.max(1, level) * fixedValue;
    setBurnDiceResult(diceVal);
    setBurnFinalValue(finalVal);
    setBurnStep('rolling');

    setTimeout(() => {
      // Apply effects
      let newCombatants = [...combat.combatants];
      targetIds.forEach(tid => {
        const tIdx = newCombatants.findIndex(c => c.combatId === tid);
        if (tIdx === -1) return;
        const c = newCombatants[tIdx];
        if (effect === 'damage') {
          const newHp = Math.max(0, c.currentHp - finalVal);
          newCombatants[tIdx] = { ...c, currentHp: newHp };
          updateCharacterStats(c.id, { currentHp: newHp });
          setStatPopups(prev => [...prev, { id: Math.random().toString(36), combatId: tid, type: 'hp', delta: -finalVal }]);
        } else if (effect === 'healHp') {
          const newHp = Math.min(c.maxHp, c.currentHp + finalVal);
          newCombatants[tIdx] = { ...c, currentHp: newHp };
          updateCharacterStats(c.id, { currentHp: newHp });
          setStatPopups(prev => [...prev, { id: Math.random().toString(36), combatId: tid, type: 'hp', delta: finalVal }]);
        } else if (effect === 'drainAura') {
          const newAura = Math.max(0, c.currentAura - finalVal);
          newCombatants[tIdx] = { ...c, currentAura: newAura };
          updateCharacterStats(c.id, { currentAura: newAura });
          setStatPopups(prev => [...prev, { id: Math.random().toString(36), combatId: tid, type: 'aura', delta: -finalVal }]);
        } else if (effect === 'gainAura') {
          const newAura = Math.min(c.maxAura, c.currentAura + finalVal);
          newCombatants[tIdx] = { ...c, currentAura: newAura };
          updateCharacterStats(c.id, { currentAura: newAura });
          setStatPopups(prev => [...prev, { id: Math.random().toString(36), combatId: tid, type: 'aura', delta: finalVal }]);
        }
      });

      // Remove card from actor's deck
      if (burnActorCombatId) {
        const aIdx = newCombatants.findIndex(c => c.combatId === burnActorCombatId);
        if (aIdx !== -1) {
          const newCardIds = newCombatants[aIdx].cardIds.filter(id => id !== card.id);
          newCombatants[aIdx] = { ...newCombatants[aIdx], cardIds: newCardIds };
          updateCharacterStats(newCombatants[aIdx].id, { cardIds: newCardIds });
        }
      }

      updateCombat({
        ...combat,
        combatants: newCombatants,
        history: [{
          id: Math.random().toString(36).substr(2, 9),
          round: combat.round,
          actor: newCombatants.find(c => c.combatId === burnActorCombatId)?.name || '?',
          cardName: `🔥 QUEIMOU: ${card.name}`,
          roll: diceVal,
          isSuccess: true,
          timestamp: Date.now(),
        }, ...combat.history],
      });

      setBurnStep('destroyed');
      setTimeout(() => {
        setBurningCard(null);
        setBurnStep('targets');
      }, 2200);
    }, 2000);
  };

  // ── Execute a Forma card activation ──────────────────────────
  const executeFormaCard = (card: Card, combatantId: string) => {
    if (!combat) return;
    const newCombatants = [...combat.combatants];
    const actorIdx = newCombatants.findIndex(c => c.combatId === combatantId);
    if (actorIdx === -1) return;

    // Deduct aura cost
    const newAura = Math.max(0, newCombatants[actorIdx].currentAura - card.auraCost);
    newCombatants[actorIdx].currentAura = newAura;
    updateCharacterStats(newCombatants[actorIdx].id, { currentAura: newAura });

    // Apply HP/aura/ammo bonuses to self (forme affects self)
    const afterBonuses = applyCardBonuses(card, [combatantId], newCombatants);

    // Mark as acted
    setActedCombatantIds(prev => new Set([...prev, combatantId]));

    // Check if forma is already active for this combatant (toggle off)
    const existingForms = combat.activeForms || [];
    const existingIdx = existingForms.findIndex(f => f.combatantId === combatantId && f.cardId === card.id);
    let newForms: ActiveForma[];
    let finalCombatants = afterBonuses;

    if (existingIdx >= 0) {
      // Toggle off — revert stat bonuses
      const existingForma = existingForms[existingIdx];
      if (existingForma.hpBonus || existingForma.auraBonus) {
        const cIdx = finalCombatants.findIndex(c => c.combatId === combatantId);
        if (cIdx !== -1) {
          const hpBonus = existingForma.hpBonus || 0;
          const auraBonus = existingForma.auraBonus || 0;
          const newMaxHp = Math.max(1, finalCombatants[cIdx].maxHp - hpBonus);
          const newMaxAura = Math.max(0, finalCombatants[cIdx].maxAura - auraBonus);
          const newCurrentHp = Math.min(finalCombatants[cIdx].currentHp, newMaxHp);
          const newCurrentAura = Math.min(finalCombatants[cIdx].currentAura, newMaxAura);
          finalCombatants = finalCombatants.map((c, i) => i === cIdx ? { ...c, maxHp: newMaxHp, maxAura: newMaxAura, currentHp: newCurrentHp, currentAura: newCurrentAura } : c);
          updateCharacterStats(finalCombatants[cIdx].id, { maxHp: newMaxHp, maxAura: newMaxAura, currentHp: newCurrentHp, currentAura: newCurrentAura });
        }
      }
      newForms = existingForms.filter((_, i) => i !== existingIdx);
    } else {
      // Activate — apply stat bonuses to maxHp/maxAura
      const hpBonus = card.formaHpBonus || 0;
      const auraBonus = card.formaAuraBonus || 0;
      if (hpBonus || auraBonus) {
        const cIdx = finalCombatants.findIndex(c => c.combatId === combatantId);
        if (cIdx !== -1) {
          const newMaxHp = finalCombatants[cIdx].maxHp + hpBonus;
          const newMaxAura = finalCombatants[cIdx].maxAura + auraBonus;
          const newCurrentHp = Math.min(finalCombatants[cIdx].currentHp + hpBonus, newMaxHp);
          const newCurrentAura = Math.min(finalCombatants[cIdx].currentAura + auraBonus, newMaxAura);
          finalCombatants = finalCombatants.map((c, i) => i === cIdx ? { ...c, maxHp: newMaxHp, maxAura: newMaxAura, currentHp: newCurrentHp, currentAura: newCurrentAura } : c);
          updateCharacterStats(finalCombatants[cIdx].id, { maxHp: newMaxHp, maxAura: newMaxAura, currentHp: newCurrentHp, currentAura: newCurrentAura });
        }
      }

      const newForma: ActiveForma = {
        combatantId,
        cardId: card.id,
        color: card.formaColor || '#f59e0b',
        iconOverride: card.formaIcon || undefined,
        extraCardIds: card.formaCardIds || [],
        duration: card.formaDuration ?? 0,
        hpBonus: hpBonus || undefined,
        auraBonus: auraBonus || undefined,
      };
      newForms = [...existingForms.filter(f => f.combatantId !== combatantId), newForma];
    }

    updateCombat({
      ...combat,
      combatants: finalCombatants,
      activeForms: newForms,
      history: [{
        id: Math.random().toString(36).substr(2, 9),
        round: combat.round,
        actor: newCombatants[actorIdx].name,
        cardName: `✦ ${card.name}`,
        roll: 0,
        isSuccess: true,
        timestamp: Date.now(),
      }, ...combat.history],
    });
  };

  // ── Deactivate an active forma (called from initiative strip) ──
  const deactivateForma = (combatantId: string) => {
    if (!combat) return;
    const existingForms = combat.activeForms || [];
    const existingForma = existingForms.find(f => f.combatantId === combatantId);
    if (!existingForma) return;

    let newCombatants = [...combat.combatants];
    const cIdx = newCombatants.findIndex(c => c.combatId === combatantId);
    if (cIdx !== -1 && (existingForma.hpBonus || existingForma.auraBonus)) {
      const hpBonus = existingForma.hpBonus || 0;
      const auraBonus = existingForma.auraBonus || 0;
      const newMaxHp = Math.max(1, newCombatants[cIdx].maxHp - hpBonus);
      const newMaxAura = Math.max(0, newCombatants[cIdx].maxAura - auraBonus);
      const newCurrentHp = Math.min(newCombatants[cIdx].currentHp, newMaxHp);
      const newCurrentAura = Math.min(newCombatants[cIdx].currentAura, newMaxAura);
      newCombatants = newCombatants.map((c, i) => i === cIdx ? { ...c, maxHp: newMaxHp, maxAura: newMaxAura, currentHp: newCurrentHp, currentAura: newCurrentAura } : c);
      updateCharacterStats(newCombatants[cIdx].id, { maxHp: newMaxHp, maxAura: newMaxAura, currentHp: newCurrentHp, currentAura: newCurrentAura });
    }

    const newForms = existingForms.filter(f => f.combatantId !== combatantId);
    updateCombat({ ...combat, combatants: newCombatants, activeForms: newForms });
  };

  const endCombat = () => {
    if (!combat) return;
    setShowEndCombatConfirm(true);
  };

  const confirmEndCombat = () => {
    if (!combat) return;
    updateCombat({ 
      ...combat, 
      isActive: false, 
      combatants: [], 
      round: 1, 
      turnIndex: 0 
    });
    setShowEndCombatConfirm(false);
    setActiveTab('journey');
  };

  // ── Mass damage/heal handler ────────────────────────────────
  const applyMassDamage = () => {
    if (!combat || !massDmgAmount || massDmgTargets.length === 0) return;
    const amount = parseInt(massDmgAmount);
    if (isNaN(amount) || amount <= 0) return;
    const newCombatants = combat.combatants.map(c => {
      if (!massDmgTargets.includes(c.combatId)) return c;
      const delta = massDmgMode === 'damage' ? -amount : amount;
      const newHp = Math.max(0, Math.min(c.maxHp, c.currentHp + delta));
      return { ...c, currentHp: newHp };
    });
    updateCombat({ ...combat, combatants: newCombatants });
    // Visual feedback
    massDmgTargets.forEach(id => {
      const delta = massDmgMode === 'damage' ? -amount : amount;
      setStatPopups(prev => [...prev, { id: Math.random().toString(36), combatId: id, type: 'hp', delta }]);
    });
    setMassDmgAmount('');
    setMassDmgTargets([]);
    setShowMassDmgPanel(false);
  };

  // ── Quick combat dice roll ──────────────────────────────────
  const doQuickCombatRoll = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    setCombatQuickRoll({ sides, result, timestamp: Date.now() });
  };

  // ── Reset turn timer on endTurn ─────────────────────────────
  const endTurnWithTimer = () => {
    if (turnTimerEnabled) {
      setTurnTimerRemaining(turnTimerSeconds);
      setTurnTimerRunning(true);
    }
    endTurn();
  };

  const addCombatantToCombatFinal = (char: Character, hp: number, aura: number, initiative: number, ammo?: number) => {
    if (!combat) return;
    
    // Save state before adding the FIRST combatant
    let currentCombatState = combat;
    if (combat.combatants.length === 0) {
        const stateToSave = { ...combat, savedState: null }; // Avoid circular or nested saved states growing indefinitely
        currentCombatState = { ...combat, savedState: stateToSave };
        // We need to update the combat state immediately so the new combatant is added to the state WITH the savedState
    }

    const newCombatant: Combatant = {
      ...char,
      currentHp: hp,
      currentAura: aura,
      currentAmmo: ammo !== undefined ? ammo : (char.currentAmmo ?? char.maxAmmo ?? 0),
      combatId: Math.random().toString(36).substr(2, 9),
      initiativeResult: initiative,
      gridPos: { x: Math.floor(Math.random() * combat.gridWidth), y: Math.floor(Math.random() * combat.gridHeight) }
    }
    
    const newCombatants = [...currentCombatState.combatants, newCombatant].sort((a, b) => b.initiativeResult - a.initiativeResult);
    
    let newTurnIndex = currentCombatState.turnIndex;
    if (currentCombatState.isActive && currentCombatState.combatants.length > 0) {
       const currentActorId = currentCombatState.combatants[currentCombatState.turnIndex].combatId;
       const newIndex = newCombatants.findIndex(c => c.combatId === currentActorId);
       if (newIndex !== -1) newTurnIndex = newIndex;
    }
    
    updateCombat({ ...currentCombatState, combatants: newCombatants, turnIndex: newTurnIndex });
    setSetupCombatant(null);
    setShowAddCombatantModal(false);
  };

  const handleManualRoll = (sides: number, label: string) => {
    const roll = Math.floor(Math.random() * sides) + 1;
    setDiceAnim({ 
      isVisible: true, 
      result: roll, 
      isSuccess: true, 
      customLabel: "RESULTADO",
      notation: `1d${sides}`,
      individualRolls: [roll],
      numSides: sides,
      bonus: 0,
    });
    
    const newHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      result: roll,
      type: label,
      timestamp: Date.now()
    };
    setRollHistory(prev => [newHistoryItem, ...prev]);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const setTimerFromInput = () => {
    const total = (timerInput.h * 3600) + (timerInput.m * 60) + timerInput.s;
    setTimerTime(total);
    setIsTimerRunning(false);
  };

  const handleMultiRoll = (sides: number, qty: number, bonus: number, label: string) => {
    const results = Array.from({length: qty}, () => Math.floor(Math.random() * sides) + 1);
    const total = results.reduce((a,b) => a+b, 0) + bonus;
    setMultiRollResults(results);
    const notation = `${qty}d${sides}${bonus !== 0 ? (bonus > 0 ? `+${bonus}` : `${bonus}`) : ''}`;
    setDiceAnim({ isVisible:true, result:total, isSuccess:true, customLabel:'RESULTADO', notation, individualRolls:results, numSides:sides, bonus });
    setRollHistory(prev => [{ id:Math.random().toString(36).substr(2,9), result:total, type:label||notation, timestamp:Date.now() }, ...prev].slice(0, 50));
  };

  const NAMES: Record<string, string[][]> = {
    fantasy: [['Aer','Bel','Cal','Dor','El','Far','Gal','Hal','Ir','Kel'],['ath','ion','ara','iel','von','eth','orn','ias','una','wyn']],
    nordic: [['Bjorn','Erik','Sigr','Thor','Ulf','Val','Heid','Ragn','Ivar','Leif'],['ald','mar','vik','sen','sson','grim','hild','run','mund','ar']],
    arabic: [['Abd','Ali','Fath','Hus','Jam','Kar','Mal','Nas','Rah','Sal'],['ullah','im','an','ud','eem','el','om','if','id','al']],
    japanese: [['Ake','Haru','Hiro','Kaz','Ken','Nao','Rei','Sak','Yuk','Yosh'],['mi','ko','to','ki','shi','ka','no','ro','i','haru']],
    latin: [['Aur','Cas','Dec','Fab','Jul','Marc','Oct','Serv','Tib','Val'],['ius','ia','anus','inus','ella','illa','us','um','ax','ix']],
  };
  const generateNames = (style: typeof nameStyle, count = 8) => {
    const [prefixes, suffixes] = NAMES[style];
    const names = Array.from({length: count}, () => {
      const p = prefixes[Math.floor(Math.random() * prefixes.length)];
      const s = suffixes[Math.floor(Math.random() * suffixes.length)];
      return p + s;
    });
    setGeneratedNames(names);
  };

  const LOOT_TABLES = {
    common: ['Moedas de cobre (2d6)', 'Tocha', 'Ração de viagem', 'Corda (15m)', 'Espelho de bolso', 'Pederneira', 'Vela (×3)', 'Saco de areia', 'Tesoura enferrujada', 'Mapa rasgado'],
    uncommon: ['Poção de cura menor', 'Óleo alquímico', 'Flecha +1 (×5)', 'Pergaminho de luz', 'Amuleto protetor', 'Cristal de ressonância', 'Pó de prata', 'Gema bruta (10po)', 'Lente de aumento', 'Kit de ladrão'],
    rare: ['Espada élfica +1', 'Anel de proteção', 'Capa de invisibilidade parcial', 'Tomo arcano', 'Cristal mágico', 'Armadura de escamas encantada', 'Cajado de fogo menor', 'Amuleto de resistência', 'Botas de velocidade', 'Varinha de detecção mágica'],
    legendary: ['Espada dos Reis', 'Artefato Antigo Fragmentado', 'Grimório do Arquimago', 'Coroa de Ferro Negro', 'Orbe do Desejo', 'Manto Estelar', 'Cetro dos Elementos', 'Anel dos Sete Selos'],
  };
  const generateLoot = (tier: keyof typeof LOOT_TABLES, qty = 3) => {
    const table = LOOT_TABLES[tier];
    const items = Array.from({length: qty}, (_, i) => ({
      id: Math.random().toString(36).substr(2,9),
      name: table[Math.floor(Math.random() * table.length)],
      rarity: tier,
    }));
    setLootList(prev => [...items, ...prev].slice(0, 20));
  };

  const stripHistory = (j: JourneyState): JourneyState => {
    const { history, future, ...rest } = j;
    return rest as JourneyState;
  };

  const handleJourneyPrevious = () => {
    if (!journey || !journey.history || journey.history.length === 0) return;
    const previous = journey.history[journey.history.length - 1];
    const newHistory = journey.history.slice(0, -1);
    const newFuture = [stripHistory(journey), ...(journey.future || [])];
    
    updateJourney({ ...previous, history: newHistory, future: newFuture });
  };

  const handleJourneyNext = () => {
    if (!journey || !journey.future || journey.future.length === 0) return;
    const next = journey.future[0];
    const newFuture = journey.future.slice(1);
    const newHistory = [...(journey.history || []), stripHistory(journey)];

    updateJourney({ ...next, history: newHistory, future: newFuture });
  };

  const handleNewWaypoint = () => {
    if (!journey) return;
    const newHistory = [...(journey.history || []), stripHistory(journey)];
    updateJourney({ 
        history: newHistory, 
        future: [],
        locationName: 'Nova Localização',
        description: '',
        notes: '',
        weatherEffects: [],  // clear weather effects when moving to new location
        // Keep image and isNight as they might be similar
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-8" style={{ background: 'var(--bg-base)' }}>
        <div style={{ width:64, height:64, border:'3px solid var(--gold-mid)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.9s linear infinite', boxShadow:'0 0 40px rgba(201,152,58,0.4)' }} />
        <div className="flex flex-col items-center">
          <Database className="w-7 h-7 mb-3 animate-pulse" style={{ color:'var(--gold-mid)' }} />
          <h2 style={{ fontFamily:"'Cinzel', serif", fontSize:16, fontWeight:700, color:'var(--text-primary)', textTransform:'uppercase', letterSpacing:'0.4em' }}>Carregando dados</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col text-slate-100 overflow-x-hidden" style={{ background: 'var(--bg-base)', backgroundImage: 'radial-gradient(ellipse at 20% 10%, rgba(201,152,58,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(100,130,200,0.03) 0%, transparent 50%)', height: '100vh', overflow: 'hidden' }} onMouseMove={handleMouseMove}>
      {/* Indicador de Autosave */}
      {autoSaveStatus !== 'idle' && (
        <div style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 99999,
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 14px', borderRadius: 10,
          background: autoSaveStatus === 'error' ? 'rgba(40,10,10,0.97)' : autoSaveStatus === 'saving' ? 'rgba(22,27,38,0.95)' : 'rgba(14,24,18,0.95)',
          border: `1px solid ${autoSaveStatus === 'error' ? 'rgba(239,68,68,0.6)' : autoSaveStatus === 'saving' ? 'var(--border-gold)' : 'rgba(34,197,94,0.45)'}`,
          backdropFilter: 'blur(16px)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', transition: 'all 0.3s ease'
        }}>
          {autoSaveStatus === 'saving'
            ? <><div style={{ width: 9, height: 9, borderRadius: '50%', border: '2px solid var(--gold-mid)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold-mid)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Salvando…</span></>
            : autoSaveStatus === 'error'
            ? <><div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 7px #ef4444' }} /><span style={{ fontSize: 10, fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Erro ao salvar</span></>
            : <><div style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 7px #22c55e' }} /><span style={{ fontSize: 10, fontWeight: 700, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Salvo!</span></>
          }
        </div>
      )}

      {/* Modal de confirmação de Import */}
      {importConfirmData && (
        <div style={{ position:'fixed', inset:0, zIndex:99998, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(8px)' }}>
          <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border-gold)', borderRadius:20, padding:32, maxWidth:460, width:'90%', display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'rgba(234,179,8,0.15)', border:'1px solid rgba(234,179,8,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Upload style={{ width:20, height:20, color:'#eab308' }} />
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)', letterSpacing:'0.03em' }}>Importar Backup</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Isso vai sobrescrever TODOS os dados atuais</div>
              </div>
            </div>

            <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:8 }}>
              {[
                ['Personagens', (importConfirmData.characters?.length ?? 0)],
                ['Habilidades', (importConfirmData.cards?.length ?? 0)],
                ['Selos', (importConfirmData.seals?.length ?? 0)],
                ['Versão do arquivo', importConfirmData.version ?? '(legado)'],
                ['Salvo em', importConfirmData.savedAt ? new Date(importConfirmData.savedAt).toLocaleString('pt-BR') : '—'],
              ].map(([label, value]) => (
                <div key={String(label)} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:'var(--text-muted)' }}>{label}</span>
                  <span style={{ color:'var(--text-primary)', fontWeight:700 }}>{String(value)}</span>
                </div>
              ))}
              {importConfirmData.extras && (
                <div style={{ fontSize:11, color:'rgba(52,211,153,0.8)', marginTop:4 }}>✓ Contém extras: notas, moedas, histórico</div>
              )}
            </div>

            {importError && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#fca5a5' }}>
                ⚠ {importError}
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setImportConfirmData(null); setImportError(null); }} style={{ flex:1, padding:'11px', borderRadius:10, fontSize:13, fontWeight:700, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-faint)', color:'var(--text-muted)', cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={confirmImport} style={{ flex:2, padding:'11px', borderRadius:10, fontSize:13, fontWeight:700, background:'linear-gradient(135deg, rgba(234,179,8,0.25), rgba(201,152,58,0.15))', border:'1px solid rgba(234,179,8,0.4)', color:'#fde68a', cursor:'pointer' }}>
                ✓ Confirmar Import
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Turn Banner Animation */}
      {/* Condition Expiry Notifications */}
      {conditionExpiryNotifs.length > 0 && (
        <div style={{ position:'fixed', top:80, right:16, zIndex:9998, display:'flex', flexDirection:'column', gap:6, maxWidth:320 }}>
          {conditionExpiryNotifs.map((msg, i) => (
            <div key={i} style={{ background:'rgba(220,38,38,0.15)', backdropFilter:'blur(20px)', border:'1px solid rgba(220,38,38,0.5)', borderRadius:12, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, animation:'fadeUp 0.3s ease', boxShadow:'0 4px 20px rgba(0,0,0,0.6)' }}>
              <XCircle style={{ width:16, height:16, color:'#f87171', flexShrink:0 }} />
              <span style={{ fontSize:11, fontWeight:700, color:'#fca5a5', textTransform:'uppercase', letterSpacing:'0.08em' }}>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {turnBanner && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
          <div style={{ animation:'turnBannerSlide 2.8s ease forwards' }}>
            {turnBanner.isFumbleTurnPass ? (
              /* Fumble Turn-Pass Banner — red/dark style */
              <div style={{ background:'linear-gradient(135deg, rgba(10,5,5,0.98), rgba(120,15,15,0.96), rgba(10,5,5,0.98))', border:'1px solid rgba(239,68,68,0.6)', borderRadius:0, padding:'20px 80px', display:'flex', alignItems:'center', gap:24, boxShadow:'0 0 80px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.06)', position:'relative', overflow:'hidden', minWidth:500, justifyContent:'center' }}>
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:'linear-gradient(180deg,transparent,#ef4444,transparent)' }} />
                <div style={{ position:'absolute', right:0, top:0, bottom:0, width:4, background:'linear-gradient(180deg,transparent,#ef4444,transparent)' }} />
                <div style={{ fontSize:36 }}>💀</div>
                {turnBanner.icon && <img src={turnBanner.icon} style={{ width:52, height:52, borderRadius:14, objectFit:'cover', border:'2px solid rgba(239,68,68,0.7)', boxShadow:'0 0 20px rgba(239,68,68,0.5)' }} />}
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.5em', marginBottom:4 }}>Falha Crítica! Turno volta para</div>
                  <div style={{ fontSize:32, fontWeight:700, color:'#fca5a5', textTransform:'uppercase', fontStyle:'italic', letterSpacing:'0.06em', textShadow:'0 0 30px rgba(239,68,68,0.8)' }}>{turnBanner.name}</div>
                </div>
              </div>
            ) : (
              /* Normal Turn Banner */
              <div style={{ background:'linear-gradient(135deg, rgba(22,27,38,0.97), rgba(120,90,20,0.95), rgba(22,27,38,0.97))', border:'1px solid rgba(212,168,83,0.5)', borderRadius:0, padding:'20px 80px', display:'flex', alignItems:'center', gap:24, boxShadow:'0 0 80px rgba(201,152,58,0.5), inset 0 1px 0 rgba(255,255,255,0.1)', position:'relative', overflow:'hidden', minWidth:500, justifyContent:'center' }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:'linear-gradient(180deg,transparent,#d4a853,transparent)' }} />
                <div style={{ position:'absolute', right:0, top:0, bottom:0, width:4, background:'linear-gradient(180deg,transparent,#d4a853,transparent)' }} />
                {turnBanner.icon && <img src={turnBanner.icon} style={{ width:52, height:52, borderRadius:14, objectFit:'cover', border:'2px solid rgba(212,168,83,0.7)', boxShadow:'0 0 20px rgba(201,152,58,0.6)' }} />}
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'#c9983a', textTransform:'uppercase', letterSpacing:'0.5em', marginBottom:4 }}>É a vez de</div>
                  <div style={{ fontSize:32, fontWeight:700, color:'white', textTransform:'uppercase', fontStyle:'italic', letterSpacing:'0.06em', textShadow:'0 0 30px rgba(212,168,83,0.8)' }}>{turnBanner.name}</div>
                </div>
                <Swords style={{ width:28, height:28, color:'#d4a853', filter:'drop-shadow(0 0 8px rgba(212,168,83,0.8))' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navbar Superior */}
      <nav className="sticky top-0 z-50 nav-glow" style={{ background: 'rgba(22,27,38,0.96)', backdropFilter: 'blur(28px) saturate(1.6)', borderBottom: '1px solid var(--border-gold)' }}>
        <div className="px-5 md:px-7 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #c9983a, #8a6520)', boxShadow: '0 0 24px rgba(201,152,58,0.45), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                <Swords className="text-white w-6 h-6 relative z-10" />
              </div>
              <div className="hidden md:block">
                <h1 style={{ fontFamily:"'Cinzel', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                  Vínculos <span style={{ background:'linear-gradient(90deg,#c9983a,#f0c060)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Além do Tempo</span>
                </h1>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 1 }}>Sistema de RPG</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-faint)' }}>
              <TabButton icon={<Swords className="w-4 h-4" />} active={activeTab === 'combat'} onClick={() => setActiveTab('combat')}>Combate</TabButton>
              <TabButton icon={<Compass className="w-4 h-4" />} active={activeTab === 'journey'} onClick={() => setActiveTab('journey')}>Jornada</TabButton>
              <TabButton icon={<Users className="w-4 h-4" />} active={activeTab === 'characters'} onClick={() => setActiveTab('characters')}>Personagens</TabButton>
              <TabButton icon={<Layers className="w-4 h-4" />} active={activeTab === 'cards'} onClick={() => setActiveTab('cards')}>Habilidades</TabButton>
              <TabButton icon={<Sparkles className="w-4 h-4" />} active={activeTab === 'seals'} onClick={() => setActiveTab('seals')}>Selos</TabButton>
              <TabButton icon={<LayoutGrid className="w-4 h-4" />} active={activeTab === 'extras'} onClick={() => setActiveTab('extras')}>Extras</TabButton>
            </div>

            <div className="flex items-center gap-1 pl-2" style={{ borderLeft: '1px solid var(--border-faint)' }}>
                {/* Salvar agora */}
                <button
                    onClick={handleManualSave}
                    disabled={isLoading || autoSaveStatus === 'saving'}
                    className="p-2.5 rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border-faint)', opacity: isLoading ? 0.5 : 1 }}
                    title="Salvar agora (Ctrl+S)"
                >
                    <Save className="w-4 h-4" />
                </button>
                {/* Exportar backup */}
                <button
                    onClick={handleDownloadBackup}
                    className="p-2.5 rounded-xl hover:text-amber-400 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border-faint)' }}
                    title="Exportar backup completo (inclui selos, notas, histórico)"
                >
                    <Download className="w-4 h-4" />
                </button>
                {/* Importar backup */}
                <button
                    onClick={() => backupFileRef.current?.click()}
                    className="p-2.5 rounded-xl hover:text-emerald-400 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border-faint)' }}
                    title="Importar backup (.json)"
                >
                    <Upload className="w-4 h-4" />
                </button>
                <input
                    type="file"
                    ref={backupFileRef}
                    onChange={handleUploadBackup}
                    className="hidden"
                    accept=".json"
                />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-5 md:p-8 max-w-[1920px] mx-auto w-full" style={{ overflow: 'auto', minHeight: 0, height: 0 }}>
        {/* ... (Previous tabs code omitted for brevity as they are unchanged) ... */}
        {/* Aba Jornada */}
        {activeTab === 'journey' && journey && (
          <div className="anim-fade-up flex flex-col gap-4" style={{ height:'100%', overflow:'hidden' }}>
             {/* Header & Controls */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h2 className="text-4xl font-black text-white uppercase italic">Jornada</h2>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Exploração e Aventura</p>
                </div>
                <div className="flex gap-4 flex-wrap">
                   {/* Sub-tab navigation */}
                   <div className="flex gap-1 p-1 rounded-2xl" style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.06)' }}>
                     {([
                       { key:'mapa', icon:<Compass className="w-4 h-4"/>, label:'Mapa' },
                       { key:'cozinhar', icon:<ChefHat className="w-4 h-4"/>, label:'Cozinhar' },
                       { key:'forjar', icon:<Hammer className="w-4 h-4"/>, label:'Forjar' },
                       { key:'upgrades', icon:<ShoppingCart className="w-4 h-4"/>, label:'Upgrades' },
                     ] as const).map(tab => (
                       <button key={tab.key}
                         onClick={() => setJourneySubTab(tab.key)}
                         className="flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold uppercase text-xs tracking-widest transition-all"
                         style={{
                           background: journeySubTab === tab.key
                             ? (tab.key === 'cozinhar' ? 'rgba(234,88,12,0.25)'
                               : tab.key === 'forjar' ? 'rgba(168,85,247,0.25)'
                               : tab.key === 'upgrades' ? 'rgba(16,185,129,0.2)'
                               : 'rgba(201,152,58,0.25)')
                             : 'transparent',
                           color: journeySubTab === tab.key
                             ? (tab.key === 'cozinhar' ? '#fb923c'
                               : tab.key === 'forjar' ? '#c084fc'
                               : tab.key === 'upgrades' ? '#34d399'
                               : '#f0c060')
                             : 'rgba(255,255,255,0.35)',
                           border: journeySubTab === tab.key
                             ? `1px solid ${tab.key === 'cozinhar' ? 'rgba(234,88,12,0.4)' : tab.key === 'forjar' ? 'rgba(168,85,247,0.4)' : tab.key === 'upgrades' ? 'rgba(16,185,129,0.35)' : 'rgba(201,152,58,0.4)'}`
                             : '1px solid transparent',
                         }}
                       >{tab.icon}{tab.label}</button>
                     ))}
                   </div>

                   {journeySubTab === 'mapa' && (<>
                   <button 
                        onClick={handleJourneyPrevious}
                        disabled={!journey.history || journey.history.length === 0}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all border border-slate-800"
                   >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                   </button>
                   <button 
                        onClick={handleJourneyNext}
                        disabled={!journey.future || journey.future.length === 0}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all border border-slate-800"
                   >
                        Próximo <ChevronRight className="w-4 h-4" />
                   </button>
                   <button onClick={handleNewWaypoint} className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all shadow-lg">
                      <MapPin className="w-4 h-4" /> Novo Local
                   </button>
                   <button onClick={() => setIsPartyModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-amber-600 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all border border-slate-800">
                      <Users className="w-4 h-4" /> Gerenciar Grupo
                   </button>
                   </>)}

                   {journeySubTab === 'cozinhar' && (
                     <button onClick={() => { setEditRecipeData({ type: 'cozinhar', ingredients: [] }); setRecipeModal({ mode:'new', type:'cozinhar' }); }}
                       className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all shadow-lg"
                       style={{ background:'linear-gradient(135deg,rgba(234,88,12,0.6),rgba(180,60,5,0.8))', border:'1px solid rgba(234,88,12,0.5)', boxShadow:'0 0 16px rgba(234,88,12,0.3)' }}>
                       <Plus className="w-4 h-4" /> Nova Receita
                     </button>
                   )}
                   {journeySubTab === 'forjar' && (
                     <button onClick={() => { setEditRecipeData({ type: 'forjar', ingredients: [] }); setRecipeModal({ mode:'new', type:'forjar' }); }}
                       className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all shadow-lg"
                       style={{ background:'linear-gradient(135deg,rgba(168,85,247,0.5),rgba(109,40,217,0.7))', border:'1px solid rgba(168,85,247,0.5)', boxShadow:'0 0 16px rgba(168,85,247,0.3)' }}>
                       <Plus className="w-4 h-4" /> Nova Receita de Forja
                     </button>
                   )}

                   <button
                     onClick={() => setActiveTab('combat')}
                     className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-extrabold uppercase text-xs tracking-widest transition-all shadow-lg hover:opacity-90"
                     style={{ background:'linear-gradient(135deg,#dc2626,#7f1d1d)', border:'1px solid rgba(220,38,38,0.5)', boxShadow:'0 0 20px rgba(220,38,38,0.3)' }}
                   >
                      <Swords className="w-4 h-4" /> Entrar em Combate
                   </button>
                </div>
             </div>

             {/* Main Content - conditionally rendered by sub-tab */}

             {/* ─── MAPA ─── */}
             {journeySubTab === 'mapa' && (
             <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Left: Location & Log */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                   {/* Location Visualization */}
                   <div className="relative flex-1 rounded-[3rem] overflow-hidden border border-slate-800 group shadow-2xl bg-slate-900/80">
                      <img src={journey.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2868&auto=format&fit=crop'} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] ease-linear hover:scale-110" />
                      
                      {/* Night overlay */}
                      {journey.isNight && (
                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(5,10,30,0.55)', mixBlendMode: 'multiply' }} />
                      )}

                      {/* RAIN animation */}
                      {(journey.weatherEffects || []).includes('rain') && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
                          <style>{`
                            @keyframes rain-fall {
                              0% { transform: translateY(-10px) translateX(0px); opacity: 0; }
                              5% { opacity: 0.8; }
                              95% { opacity: 0.6; }
                              100% { transform: translateY(110vh) translateX(-30px); opacity: 0; }
                            }
                          `}</style>
                          {Array.from({ length: 60 }).map((_, i) => (
                            <div key={i} style={{
                              position: 'absolute',
                              left: `${Math.random() * 110 - 5}%`,
                              top: `-${Math.random() * 20}%`,
                              width: 1.5,
                              height: Math.random() * 18 + 10,
                              background: 'linear-gradient(180deg, transparent, rgba(160,200,255,0.7), rgba(120,180,255,0.4))',
                              borderRadius: 99,
                              animation: `rain-fall ${Math.random() * 0.6 + 0.7}s linear ${Math.random() * 2}s infinite`,
                              transform: 'rotate(12deg)',
                            }} />
                          ))}
                          <div style={{ position:'absolute', inset:0, background:'rgba(80,120,180,0.08)' }} />
                        </div>
                      )}

                      {/* STORM animation */}
                      {(journey.weatherEffects || []).includes('storm') && (() => {
                        return (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>
                            <style>{`
                              @keyframes storm-rain {
                                0% { transform: translateY(-10px) translateX(0px); opacity: 0; }
                                5% { opacity: 1; }
                                95% { opacity: 0.7; }
                                100% { transform: translateY(110vh) translateX(-50px); opacity: 0; }
                              }
                              @keyframes lightning-flash {
                                0%, 100% { opacity: 0; }
                                2% { opacity: 0.9; }
                                4% { opacity: 0; }
                                6% { opacity: 0.6; }
                                8% { opacity: 0; }
                              }
                              @keyframes lightning-bolt {
                                0% { opacity: 0; transform: scaleY(0); }
                                10% { opacity: 1; transform: scaleY(1); }
                                30% { opacity: 1; transform: scaleY(1); }
                                60% { opacity: 0; transform: scaleY(1); }
                                100% { opacity: 0; }
                              }
                            `}</style>
                            {/* Heavy rain */}
                            {Array.from({ length: 80 }).map((_, i) => (
                              <div key={i} style={{
                                position: 'absolute',
                                left: `${Math.random() * 115 - 5}%`,
                                top: `-${Math.random() * 20}%`,
                                width: 2,
                                height: Math.random() * 22 + 14,
                                background: 'linear-gradient(180deg, transparent, rgba(180,220,255,0.85))',
                                borderRadius: 99,
                                animation: `storm-rain ${Math.random() * 0.4 + 0.4}s linear ${Math.random() * 1.5}s infinite`,
                                transform: 'rotate(20deg)',
                              }} />
                            ))}
                            {/* Lightning flashes */}
                            {[0, 1, 2].map(li => (
                              <div key={li} style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(220,240,255,0.15)',
                                animation: `lightning-flash ${4 + li * 3}s ease-in-out ${li * 2.5}s infinite`,
                              }} />
                            ))}
                            {/* Lightning bolt SVGs */}
                            {[
                              { left: '25%', delay: '1.2s', dur: '6s' },
                              { left: '60%', delay: '4s', dur: '8s' },
                              { left: '80%', delay: '2.5s', dur: '7s' },
                            ].map((bolt, bi) => (
                              <svg key={bi} style={{
                                position: 'absolute',
                                top: 0, left: bolt.left,
                                width: 32, height: 140,
                                animation: `lightning-bolt ${bolt.dur} ease-in-out ${bolt.delay} infinite`,
                                transformOrigin: 'top center',
                                filter: 'drop-shadow(0 0 8px rgba(200,220,255,0.9))',
                                opacity: 0,
                              }}>
                                <polyline points="16,0 6,55 16,55 4,140" fill="none" stroke="rgba(220,240,255,0.95)" strokeWidth="3" strokeLinejoin="round" />
                                <polyline points="16,0 6,55 16,55 4,140" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                              </svg>
                            ))}
                            <div style={{ position:'absolute', inset:0, background:'rgba(40,60,100,0.18)' }} />
                          </div>
                        );
                      })()}

                      {/* FOG animation */}
                      {(journey.weatherEffects || []).includes('fog') && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
                          <style>{`
                            @keyframes fog-drift-1 {
                              0% { transform: translateX(-5%) scaleY(1); opacity: 0.55; }
                              50% { transform: translateX(5%) scaleY(1.05); opacity: 0.7; }
                              100% { transform: translateX(-5%) scaleY(1); opacity: 0.55; }
                            }
                            @keyframes fog-drift-2 {
                              0% { transform: translateX(8%) scaleY(0.95); opacity: 0.45; }
                              50% { transform: translateX(-8%) scaleY(1.1); opacity: 0.6; }
                              100% { transform: translateX(8%) scaleY(0.95); opacity: 0.45; }
                            }
                            @keyframes fog-drift-3 {
                              0% { transform: translateX(-12%) scaleY(1.1); opacity: 0.35; }
                              50% { transform: translateX(6%) scaleY(0.9); opacity: 0.5; }
                              100% { transform: translateX(-12%) scaleY(1.1); opacity: 0.35; }
                            }
                          `}</style>
                          {/* Base fog layer */}
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(ellipse 140% 60% at 50% 60%, rgba(200,210,220,0.38) 0%, rgba(180,195,210,0.22) 50%, transparent 75%)',
                            animation: 'fog-drift-1 12s ease-in-out infinite',
                          }} />
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(ellipse 120% 50% at 30% 70%, rgba(200,210,220,0.3) 0%, rgba(180,195,210,0.18) 50%, transparent 70%)',
                            animation: 'fog-drift-2 17s ease-in-out infinite',
                          }} />
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(ellipse 110% 45% at 70% 50%, rgba(200,212,225,0.28) 0%, transparent 65%)',
                            animation: 'fog-drift-3 22s ease-in-out infinite',
                          }} />
                          {/* Ground fog */}
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
                            background: 'linear-gradient(0deg, rgba(195,208,220,0.5) 0%, rgba(195,208,220,0.3) 40%, transparent 100%)',
                            animation: 'fog-drift-1 9s ease-in-out 1s infinite',
                          }} />
                        </div>
                      )}

                      {/* SNOW animation */}
                      {(journey.weatherEffects || []).includes('snow') && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
                          <style>{`
                            @keyframes snow-fall {
                              0% { transform: translateY(-10px) translateX(0px) rotate(0deg); opacity: 0; }
                              10% { opacity: 0.9; }
                              90% { opacity: 0.7; }
                              100% { transform: translateY(110vh) translateX(var(--snow-drift)) rotate(360deg); opacity: 0; }
                            }
                          `}</style>
                          {Array.from({ length: 55 }).map((_, i) => {
                            const size = Math.random() * 6 + 3;
                            const drift = (Math.random() - 0.5) * 80;
                            return (
                              <div key={i} style={{
                                position: 'absolute',
                                left: `${Math.random() * 105 - 2}%`,
                                top: `-${Math.random() * 15}%`,
                                width: size,
                                height: size,
                                borderRadius: '50%',
                                background: 'rgba(230,240,255,0.9)',
                                boxShadow: '0 0 4px rgba(200,220,255,0.6)',
                                ['--snow-drift' as any]: `${drift}px`,
                                animation: `snow-fall ${Math.random() * 3 + 3}s linear ${Math.random() * 5}s infinite`,
                              }} />
                            );
                          })}
                          <div style={{ position:'absolute', inset:0, background:'rgba(200,220,255,0.07)' }} />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4" style={{ zIndex: 10 }}>
                         <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> Localização Atual</label>
                            <input 
                                value={journey.locationName} 
                                onChange={(e) => updateJourney({ locationName: e.target.value })} 
                                className="text-4xl md:text-6xl font-black text-white bg-transparent outline-none uppercase italic placeholder-white/20 w-full drop-shadow-lg" 
                                placeholder="Nome do Local..." 
                            />
                         </div>
                         
                         <div className="flex flex-wrap gap-3 items-center">
                            {/* Day/Night toggle */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0,
                              background: 'rgba(0,0,0,0.5)',
                              backdropFilter: 'blur(12px)',
                              borderRadius: 16,
                              padding: 4,
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                              <button
                                onClick={() => updateJourney({ isNight: false })}
                                title="Dia"
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: 12,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: !journey.isNight ? 'rgba(255,220,80,0.25)' : 'transparent',
                                  color: !journey.isNight ? '#fcd34d' : 'rgba(255,255,255,0.35)',
                                  transition: 'all 0.2s',
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                                  boxShadow: !journey.isNight ? '0 0 12px rgba(252,211,77,0.3)' : 'none',
                                }}
                              >
                                <Sun style={{ width: 14, height: 14 }} /> Dia
                              </button>
                              <button
                                onClick={() => updateJourney({ isNight: true })}
                                title="Noite"
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: 12,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: journey.isNight ? 'rgba(100,120,255,0.25)' : 'transparent',
                                  color: journey.isNight ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                                  transition: 'all 0.2s',
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                                  boxShadow: journey.isNight ? '0 0 12px rgba(165,180,252,0.3)' : 'none',
                                }}
                              >
                                <Moon style={{ width: 14, height: 14 }} /> Noite
                              </button>
                            </div>

                            {/* Weather effect toggles */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              background: 'rgba(0,0,0,0.5)',
                              backdropFilter: 'blur(12px)',
                              borderRadius: 16,
                              padding: 4,
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                              {([
                                { id: 'rain' as const,  label: 'Chuva',      icon: <CloudRain style={{width:16,height:16}}/>,      activeColor: 'rgba(96,165,250,0.3)',  textColor: '#93c5fd', glow: 'rgba(96,165,250,0.4)' },
                                { id: 'storm' as const, label: 'Tempestade', icon: <CloudLightning style={{width:16,height:16}}/>,  activeColor: 'rgba(139,92,246,0.3)', textColor: '#c4b5fd', glow: 'rgba(139,92,246,0.4)' },
                                { id: 'fog' as const,   label: 'Névoa',      icon: <Cloud style={{width:16,height:16}}/>,           activeColor: 'rgba(148,163,184,0.3)', textColor: '#cbd5e1', glow: 'rgba(148,163,184,0.4)' },
                                { id: 'snow' as const,  label: 'Neve',       icon: <Snowflake style={{width:16,height:16}}/>,       activeColor: 'rgba(186,230,253,0.3)', textColor: '#bae6fd', glow: 'rgba(186,230,253,0.4)' },
                              ] as const).map(w => {
                                const currentEffects = journey.weatherEffects || [];
                                const isActive = currentEffects.includes(w.id);
                                return (
                                  <button
                                    key={w.id}
                                    onClick={() => {
                                      const newEffects = isActive
                                        ? currentEffects.filter(e => e !== w.id)
                                        : [...currentEffects, w.id];
                                      updateJourney({ weatherEffects: newEffects });
                                    }}
                                    title={w.label}
                                    style={{
                                      padding: '8px 10px',
                                      borderRadius: 12,
                                      border: isActive ? `1px solid ${w.textColor}55` : '1px solid transparent',
                                      cursor: 'pointer',
                                      background: isActive ? w.activeColor : 'transparent',
                                      color: isActive ? w.textColor : 'rgba(255,255,255,0.35)',
                                      transition: 'all 0.2s',
                                      display: 'flex', alignItems: 'center', gap: 5,
                                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                                      boxShadow: isActive ? `0 0 14px ${w.glow}` : 'none',
                                    }}
                                  >
                                    {w.icon}
                                    <span style={{ fontSize: 10 }}>{w.label}</span>
                                    {isActive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: w.textColor, boxShadow: `0 0 5px ${w.textColor}` }} />}
                                  </button>
                                );
                              })}
                            </div>
                            
                            {/* Random Event Button */}
                            <button onClick={() => handleManualRoll(20, "Evento Aleatório")} className="flex items-center gap-2 px-6 py-4 bg-amber-600 hover:bg-amber-500 rounded-2xl text-white font-extrabold uppercase text-xs shadow-lg">
                                <Dices className="w-4 h-4" /> Checar Evento
                            </button>
                         </div>
                      </div>
                      
                      {/* Image Edit Button (Top Right) */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ zIndex: 10 }}>
                         <ImagePickerButton value={journey.image} onUpdate={(val) => updateJourney({ image: val })} label="Fundo da Jornada" buttonLabel="Fundo" placement="bottom-left" />
                      </div>
                   </div>
                </div>

                {/* Right: Party Status & Notes */}
                <div className="flex flex-col gap-6 min-h-0">
                   {/* Party List */}
                   <div className="flex-1 glass-panel rounded-[2.5rem] p-6 overflow-y-auto custom-scroll flex flex-col border border-amber-900/20">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-widest flex items-center gap-2"><Tent className="w-4 h-4" /> Grupo Ativo</h3>
                        <span className="text-xs font-bold bg-slate-900 px-2 py-1 rounded text-slate-400">{journeyCharacters.length} membros</span>
                      </div>
                      
                      <div className="space-y-3">
                         {journeyCharacters.map(char => (
                            <div key={char.id} className="bg-slate-900/80/50 p-3 rounded-[1.5rem] border border-slate-800 flex items-center gap-4 hover:border-amber-600/50 transition-colors group">
                                <div className="relative cursor-pointer" onClick={() => setQuickEditChar(char)}>
                                   <img src={char.icon || undefined} className="w-14 h-14 rounded-2xl object-cover bg-slate-900" />
                                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity">
                                       <Edit3 className="w-5 h-5 text-white" />
                                   </div>
                                </div>
                                <div className="flex-1 space-y-1.5 min-w-0">
                                   <div className="flex justify-between items-center">
                                       <p className="font-extrabold uppercase text-white truncate text-xs">{char.name}</p>
                                       <div className="flex gap-1">
                                            {char.conditions.map(c => (
                                                <span key={c.name} className="w-2 h-2 rounded-full bg-rose-500" title={c.name} />
                                            ))}
                                       </div>
                                   </div>
                                   {/* HP — combat-style ±1/±5 */}
                                   <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                     <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:1 }}>
                                       <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                         <Heart style={{ width:9, height:9, color:'#f87171' }} />
                                         <span style={{ fontSize:7, fontWeight:700, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.15em' }}>HP</span>
                                       </div>
                                       <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#fca5a5' }}>{char.currentHp}/{char.maxHp}</span>
                                     </div>
                                     <div style={{ height:7, background:'rgba(0,0,0,0.5)', borderRadius:99, overflow:'hidden', border:'1px solid rgba(239,68,68,0.2)' }}>
                                       <div style={{ height:'100%', borderRadius:99, width:`${Math.max(0,Math.min(100,(char.currentHp/char.maxHp)*100))}%`, background: char.currentHp/char.maxHp > 0.5 ? 'linear-gradient(90deg,#16a34a,#4ade80)' : char.currentHp/char.maxHp > 0.2 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)', boxShadow:'0 0 6px rgba(239,68,68,0.5)', transition:'width 0.5s ease' }} />
                                     </div>
                                     <div style={{ display:'flex', gap:2 }}>
                                       {([-5,-1,1,5] as const).map(d => (
                                         <button key={d} onClick={() => updateCharacterStats(char.id, { currentHp: Math.max(0, Math.min(char.maxHp, char.currentHp + d)) })}
                                           style={{ flex:1, padding:'2px 0', fontSize:8, fontWeight:900, borderRadius:4, cursor:'pointer', lineHeight:1.1, border:'1px solid', borderColor:d<0?'rgba(239,68,68,0.4)':'rgba(34,197,94,0.4)', background:d<0?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)', color:d<0?'#fca5a5':'#86efac' }}
                                         >{d>0?`+${d}`:d}</button>
                                       ))}
                                     </div>
                                   </div>
                                   {/* Aura — combat-style ±1/±5 */}
                                   <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                     <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:1 }}>
                                       <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                         <Zap style={{ width:9, height:9, color:'#60a5fa' }} />
                                         <span style={{ fontSize:7, fontWeight:700, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.15em' }}>AURA</span>
                                       </div>
                                       <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#93c5fd' }}>{char.currentAura}/{char.maxAura}</span>
                                     </div>
                                     <div style={{ height:7, background:'rgba(0,0,0,0.5)', borderRadius:99, overflow:'hidden', border:'1px solid rgba(59,130,246,0.2)' }}>
                                       <div style={{ height:'100%', borderRadius:99, width:`${Math.max(0,Math.min(100,(char.currentAura/char.maxAura)*100))}%`, background:'linear-gradient(90deg,#1d4ed8,#60a5fa)', boxShadow:'0 0 6px rgba(96,165,250,0.5)', transition:'width 0.5s ease' }} />
                                     </div>
                                     <div style={{ display:'flex', gap:2 }}>
                                       {([-5,-1,1,5] as const).map(d => (
                                         <button key={d} onClick={() => updateCharacterStats(char.id, { currentAura: Math.max(0, Math.min(char.maxAura, char.currentAura + d)) })}
                                           style={{ flex:1, padding:'1px 0', fontSize:7, fontWeight:900, borderRadius:3, cursor:'pointer', lineHeight:1.2, border:'1px solid', borderColor:d<0?'rgba(59,130,246,0.35)':'rgba(59,130,246,0.5)', background:d<0?'rgba(59,130,246,0.08)':'rgba(59,130,246,0.14)', color:'#93c5fd' }}
                                         >{d>0?`+${d}`:d}</button>
                                       ))}
                                     </div>
                                   </div>
                                   {/* Ammo — combat-style ±1/±5 */}
                                   {(char.maxAmmo || 0) > 0 && (
                                     <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                       <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:1 }}>
                                         <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                           <span style={{ fontSize:9 }}>🎯</span>
                                           <span style={{ fontSize:7, fontWeight:700, color:'#f97316', textTransform:'uppercase', letterSpacing:'0.15em' }}>MUNIÇÃO</span>
                                         </div>
                                         <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#fb923c' }}>{char.currentAmmo??0}/{char.maxAmmo}</span>
                                       </div>
                                       <div style={{ height:6, background:'rgba(0,0,0,0.5)', borderRadius:99, overflow:'hidden', border:'1px solid rgba(249,115,22,0.2)' }}>
                                         <div style={{ height:'100%', borderRadius:99, width:`${Math.max(0,Math.min(100,((char.currentAmmo??0)/char.maxAmmo!)*100))}%`, background:'linear-gradient(90deg,#c2410c,#f97316)', boxShadow:'0 0 5px rgba(249,115,22,0.5)', transition:'width 0.5s ease' }} />
                                       </div>
                                       <div style={{ display:'flex', gap:2 }}>
                                         {([-5,-1,1,5] as const).map(d => (
                                           <button key={d} onClick={() => updateCharacterStats(char.id, { currentAmmo: Math.max(0, Math.min(char.maxAmmo!, (char.currentAmmo??0) + d)) })}
                                             style={{ flex:1, padding:'1px 0', fontSize:7, fontWeight:900, borderRadius:3, cursor:'pointer', lineHeight:1.2, border:'1px solid', borderColor:d<0?'rgba(249,115,22,0.35)':'rgba(249,115,22,0.5)', background:d<0?'rgba(249,115,22,0.08)':'rgba(249,115,22,0.14)', color:'#fdba74' }}
                                           >{d>0?`+${d}`:d}</button>
                                         ))}
                                       </div>
                                     </div>
                                   )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => setManagingConditionsCharId(char.id)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors" title="Gerenciar Condições">
                                        <Activity className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setOpenInventoryCharId(char.id)} className="p-2 hover:bg-amber-900/40 rounded-lg text-slate-500 hover:text-amber-400 transition-colors" title="Abrir Inventário">
                                        <Briefcase className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                         ))}
                         {journeyCharacters.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center">
                                <Users className="w-12 h-12 mb-2" />
                                <p className="text-xs font-extrabold uppercase">Ninguém no grupo</p>
                            </div>
                         )}
                      </div>
                   </div>
                   
                   {/* Notes */}
                   <div className="h-64 glass-panel rounded-[2.5rem] p-6 flex flex-col border border-amber-900/20">
                      <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-widest mb-4 flex items-center gap-2"><ScrollText className="w-4 h-4" /> Diário de Bordo</h3>
                      <textarea 
                        value={journey.notes}
                        onChange={(e) => updateJourney({ notes: e.target.value })}
                        className="flex-1 bg-slate-900/80/50 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 outline-none focus:border-amber-600 resize-none custom-scroll leading-relaxed" 
                        placeholder="Anotações sobre a aventura..." 
                      />
                   </div>
                </div>
             </div>
             )} {/* end journeySubTab === 'mapa' */}

             {/* ─── COZINHAR ─── */}
             {journeySubTab === 'cozinhar' && (() => {
               const cookRecipes = (journey.recipes || []).filter(r => r.type === 'cozinhar');
               return (
                 <div className="flex-1 min-h-0 overflow-y-auto custom-scroll">
                   <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16, padding:'4px 2px' }}>
                     {cookRecipes.map(recipe => {
                       const canCraftBy = journeyCharacters.filter(char => {
                         return recipe.ingredients.every(ing => {
                           const item = (char.items || []).find(it => it.name.toLowerCase() === ing.itemName.toLowerCase());
                           return (item?.quantity ?? (item ? 1 : 0)) >= ing.quantity;
                         });
                       });
                       return (
                         <div key={recipe.id} style={{ background:'rgba(22,27,38,0.95)', border:'1px solid rgba(234,88,12,0.3)', borderRadius:20, overflow:'hidden', transition:'border-color 0.2s' }}
                           className="hover:border-orange-500/60">
                           {/* Header */}
                           <div style={{ background:'linear-gradient(135deg,rgba(234,88,12,0.2),rgba(180,60,5,0.3))', borderBottom:'1px solid rgba(234,88,12,0.2)', padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
                             <div style={{ width:44, height:44, borderRadius:12, background: recipe.resultImage ? 'transparent' : 'rgba(234,88,12,0.2)', border:'1px solid rgba(234,88,12,0.3)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                               {recipe.resultImage ? <img src={recipe.resultImage} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <ChefHat style={{ width:22, height:22, color:'#fb923c' }} />}
                             </div>
                             <div style={{ flex:1, minWidth:0 }}>
                               <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                                 <p style={{ fontSize:13, fontWeight:800, color:'#fff', textTransform:'uppercase', letterSpacing:'0.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{recipe.name}</p>
                                 {recipe.difficulty && <span style={{ fontSize:8, fontWeight:700, color: recipe.difficulty==='fácil'?'#86efac':recipe.difficulty==='médio'?'#fcd34d':'#f87171', background: recipe.difficulty==='fácil'?'rgba(34,197,94,0.12)':recipe.difficulty==='médio'?'rgba(234,179,8,0.12)':'rgba(239,68,68,0.12)', border:`1px solid ${recipe.difficulty==='fácil'?'rgba(34,197,94,0.3)':recipe.difficulty==='médio'?'rgba(234,179,8,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:6, padding:'2px 6px', textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0 }}>{recipe.difficulty}</span>}
                               </div>
                               <p style={{ fontSize:10, color:'rgba(251,146,60,0.7)', fontWeight:600 }}>Cria: <span style={{ color:'#fb923c', fontWeight:700 }}>{recipe.resultQuantity}x {recipe.resultItemName}</span>{recipe.craftingTime ? ` · ${recipe.craftingTime}` : ''}</p>
                             </div>
                             <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                               <button onClick={() => { setEditRecipeData({...recipe}); setRecipeModal({ mode:'edit', recipe, type:'cozinhar' }); }} style={{ padding:'5px 7px', background:'rgba(234,88,12,0.15)', border:'1px solid rgba(234,88,12,0.25)', borderRadius:8, color:'#fb923c', cursor:'pointer' }} className="hover:brightness-125"><Edit3 style={{ width:12, height:12 }} /></button>
                               <button onClick={() => deleteRecipe(recipe.id)} style={{ padding:'5px 7px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#f87171', cursor:'pointer' }} className="hover:brightness-125"><Trash2 style={{ width:12, height:12 }} /></button>
                             </div>
                           </div>
                           {/* Body */}
                           <div style={{ padding:'14px 16px' }}>
                             {recipe.description && <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:12, lineHeight:1.5 }}>{recipe.description}</p>}
                             {/* Ingredients */}
                             <div style={{ marginBottom:12 }}>
                               <p style={{ fontSize:9, fontWeight:700, color:'rgba(251,146,60,0.6)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>Ingredientes</p>
                               <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                                 {recipe.ingredients.map((ing, i) => {
                                   const haveCount = (craftCharacterId ? characters.find(c=>c.id===craftCharacterId)?.items?.find(it=>it.name.toLowerCase()===ing.itemName.toLowerCase())?.quantity ?? 0 : 0);
                                   return (
                                     <span key={i} style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.7)', background:'rgba(234,88,12,0.1)', border:'1px solid rgba(234,88,12,0.2)', borderRadius:6, padding:'3px 8px' }}>
                                       {ing.quantity}× {ing.itemName}
                                     </span>
                                   );
                                 })}
                               </div>
                             </div>
                             {/* Craft button */}
                             <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                               <select value={craftCharacterId} onChange={e => setCraftCharacterId(e.target.value)} style={{ flex:1, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(234,88,12,0.25)', borderRadius:10, padding:'7px 10px', color: craftCharacterId ? '#fff' : 'rgba(255,255,255,0.35)', fontSize:11, fontWeight:600, outline:'none' }}>
                                 <option value="">Selecionar personagem...</option>
                                 {journeyCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                               </select>
                               <button
                                 onClick={() => craftCharacterId && executeRecipe(recipe, craftCharacterId)}
                                 disabled={!craftCharacterId || !canCraftBy.some(c => c.id === craftCharacterId)}
                                 style={{ padding:'8px 16px', background: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'linear-gradient(135deg,rgba(234,88,12,0.7),rgba(180,60,5,0.9))' : 'rgba(60,60,60,0.4)', border:`1px solid ${craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'rgba(234,88,12,0.5)' : 'rgba(80,80,80,0.3)'}`, borderRadius:10, color: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', cursor: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}
                                 className="transition-all hover:brightness-110">
                                 <Flame style={{ width:13, height:13 }} /> Cozinhar
                               </button>
                             </div>
                             {canCraftBy.length > 0 && <p style={{ fontSize:9, color:'#86efac', marginTop:5, fontWeight:600 }}>✓ {canCraftBy.map(c=>c.name).join(', ')} pode{canCraftBy.length > 1 ? 'm' : ''} preparar</p>}
                           </div>
                         </div>
                       );
                     })}
                     {cookRecipes.length === 0 && (
                       <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:'60px 0', opacity:0.3 }}>
                         <ChefHat style={{ width:48, height:48, color:'#fb923c' }} />
                         <p style={{ fontSize:13, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'0.2em' }}>Nenhuma receita cadastrada</p>
                         <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Clique em "Nova Receita" para adicionar</p>
                       </div>
                     )}
                   </div>
                 </div>
               );
             })()}

             {/* ─── FORJAR ─── */}
             {journeySubTab === 'forjar' && (() => {
               const forgeRecipes = (journey.recipes || []).filter(r => r.type === 'forjar');
               return (
                 <div className="flex-1 min-h-0 overflow-y-auto custom-scroll">
                   <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16, padding:'4px 2px' }}>
                     {forgeRecipes.map(recipe => {
                       const canCraftBy = journeyCharacters.filter(char => {
                         return recipe.ingredients.every(ing => {
                           const item = (char.items || []).find(it => it.name.toLowerCase() === ing.itemName.toLowerCase());
                           return (item?.quantity ?? (item ? 1 : 0)) >= ing.quantity;
                         });
                       });
                       return (
                         <div key={recipe.id} style={{ background:'rgba(22,27,38,0.95)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:20, overflow:'hidden', transition:'border-color 0.2s' }}
                           className="hover:border-purple-500/60">
                           {/* Header */}
                           <div style={{ background:'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(109,40,217,0.3))', borderBottom:'1px solid rgba(168,85,247,0.2)', padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
                             <div style={{ width:44, height:44, borderRadius:12, background: recipe.resultImage ? 'transparent' : 'rgba(168,85,247,0.2)', border:'1px solid rgba(168,85,247,0.3)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                               {recipe.resultImage ? <img src={recipe.resultImage} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Hammer style={{ width:22, height:22, color:'#c084fc' }} />}
                             </div>
                             <div style={{ flex:1, minWidth:0 }}>
                               <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                                 <p style={{ fontSize:13, fontWeight:800, color:'#fff', textTransform:'uppercase', letterSpacing:'0.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{recipe.name}</p>
                                 {recipe.difficulty && <span style={{ fontSize:8, fontWeight:700, color: recipe.difficulty==='fácil'?'#86efac':recipe.difficulty==='médio'?'#fcd34d':'#f87171', background: recipe.difficulty==='fácil'?'rgba(34,197,94,0.12)':recipe.difficulty==='médio'?'rgba(234,179,8,0.12)':'rgba(239,68,68,0.12)', border:`1px solid ${recipe.difficulty==='fácil'?'rgba(34,197,94,0.3)':recipe.difficulty==='médio'?'rgba(234,179,8,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:6, padding:'2px 6px', textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0 }}>{recipe.difficulty}</span>}
                               </div>
                               <p style={{ fontSize:10, color:'rgba(192,132,252,0.7)', fontWeight:600 }}>Forja: <span style={{ color:'#c084fc', fontWeight:700 }}>{recipe.resultQuantity}x {recipe.resultItemName}</span>{recipe.craftingTime ? ` · ${recipe.craftingTime}` : ''}</p>
                             </div>
                             <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                               <button onClick={() => { setEditRecipeData({...recipe}); setRecipeModal({ mode:'edit', recipe, type:'forjar' }); }} style={{ padding:'5px 7px', background:'rgba(168,85,247,0.15)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:8, color:'#c084fc', cursor:'pointer' }} className="hover:brightness-125"><Edit3 style={{ width:12, height:12 }} /></button>
                               <button onClick={() => deleteRecipe(recipe.id)} style={{ padding:'5px 7px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#f87171', cursor:'pointer' }} className="hover:brightness-125"><Trash2 style={{ width:12, height:12 }} /></button>
                             </div>
                           </div>
                           {/* Body */}
                           <div style={{ padding:'14px 16px' }}>
                             {recipe.description && <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:12, lineHeight:1.5 }}>{recipe.description}</p>}
                             {/* Materials */}
                             <div style={{ marginBottom:12 }}>
                               <p style={{ fontSize:9, fontWeight:700, color:'rgba(192,132,252,0.6)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>Materiais</p>
                               <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                                 {recipe.ingredients.map((ing, i) => (
                                   <span key={i} style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.7)', background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:6, padding:'3px 8px' }}>
                                     {ing.quantity}× {ing.itemName}
                                   </span>
                                 ))}
                               </div>
                             </div>
                             {/* Forge button */}
                             <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                               <select value={craftCharacterId} onChange={e => setCraftCharacterId(e.target.value)} style={{ flex:1, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:10, padding:'7px 10px', color: craftCharacterId ? '#fff' : 'rgba(255,255,255,0.35)', fontSize:11, fontWeight:600, outline:'none' }}>
                                 <option value="">Selecionar personagem...</option>
                                 {journeyCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                               </select>
                               <button
                                 onClick={() => craftCharacterId && executeRecipe(recipe, craftCharacterId)}
                                 disabled={!craftCharacterId || !canCraftBy.some(c => c.id === craftCharacterId)}
                                 style={{ padding:'8px 16px', background: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'linear-gradient(135deg,rgba(168,85,247,0.6),rgba(109,40,217,0.8))' : 'rgba(60,60,60,0.4)', border:`1px solid ${craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'rgba(168,85,247,0.5)' : 'rgba(80,80,80,0.3)'}`, borderRadius:10, color: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', cursor: craftCharacterId && canCraftBy.some(c=>c.id===craftCharacterId) ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}
                                 className="transition-all hover:brightness-110">
                                 <Hammer style={{ width:13, height:13 }} /> Forjar
                               </button>
                             </div>
                             {canCraftBy.length > 0 && <p style={{ fontSize:9, color:'#86efac', marginTop:5, fontWeight:600 }}>✓ {canCraftBy.map(c=>c.name).join(', ')} pode{canCraftBy.length > 1 ? 'm' : ''} forjar</p>}
                           </div>
                         </div>
                       );
                     })}
                     {forgeRecipes.length === 0 && (
                       <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:'60px 0', opacity:0.3 }}>
                         <Hammer style={{ width:48, height:48, color:'#c084fc' }} />
                         <p style={{ fontSize:13, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'0.2em' }}>Nenhuma forja cadastrada</p>
                         <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Clique em "Nova Receita de Forja" para adicionar</p>
                       </div>
                     )}
                   </div>
                 </div>
               );
             })()}

             {/* ─── UPGRADES (Loja) ─── */}
             {journeySubTab === 'upgrades' && (() => {
               const rarityConf = { common:{border:'rgba(148,163,184,0.35)',bg:'rgba(15,23,42,0.92)',label:'#94a3b8',glow:'rgba(148,163,184,0.1)',badge:'COMUM'}, uncommon:{border:'rgba(52,211,153,0.5)',bg:'rgba(5,25,20,0.94)',label:'#34d399',glow:'rgba(52,211,153,0.18)',badge:'INCOMUM'}, rare:{border:'rgba(99,102,241,0.55)',bg:'rgba(8,8,30,0.95)',label:'#818cf8',glow:'rgba(99,102,241,0.22)',badge:'RARO'}, legendary:{border:'rgba(251,191,36,0.7)',bg:'rgba(20,14,2,0.96)',label:'#fbbf24',glow:'rgba(251,191,36,0.35)',badge:'LENDÁRIO'} };
               const offerIcons: Record<UpgradeOfferType, string> = { vitalidade:'❤', aura:'⚡', reroll:'🎲', par:'✌', trinca:'🔱', quadra:'♦', nova_carta:'🃏', desejo:'✨' };
               const luckConf = { sorte:{ label:'🍀 Sorte', color:'#34d399', bg:'rgba(52,211,153,0.15)', border:'rgba(52,211,153,0.4)' }, neutro:{ label:'⚖ Neutro', color:'#94a3b8', bg:'rgba(148,163,184,0.1)', border:'rgba(148,163,184,0.3)' }, azar:{ label:'💀 Azar', color:'#f87171', bg:'rgba(248,113,113,0.12)', border:'rgba(248,113,113,0.4)' } };
               const journeyParty = characters.filter(c => c.isInJourney);
               return (
                 <div style={{ flex:1, display:'flex', flexDirection:'column', gap:20, minHeight:0, overflowY:'auto', paddingBottom:20 }} className="custom-scroll">
                   {/* Shop header */}
                   <div style={{ display:'flex', gap:16, alignItems:'stretch', flexWrap:'wrap' }}>
                     {/* Config panel */}
                     <div style={{ flex:'1 1 320px', background:'rgba(15,23,42,0.9)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20, padding:'18px 20px', display:'flex', flexDirection:'column', gap:14, boxShadow:'0 0 30px rgba(16,185,129,0.05)' }}>
                       <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                         <ShoppingCart style={{ width:16, height:16, color:'#34d399' }} />
                         <span style={{ fontSize:11, fontWeight:800, color:'#34d399', textTransform:'uppercase', letterSpacing:'0.2em' }}>Configurar Loja</span>
                       </div>

                       {/* Offer count */}
                       <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                         <label style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.12em', width:90, flexShrink:0 }}>Nº de ofertas</label>
                         <div style={{ display:'flex', gap:4 }}>
                           {[2,3,4,5,6,8].map(n => (
                             <button key={n} onClick={() => setUpgradeShopOfferCount(n)}
                               style={{ width:30, height:30, borderRadius:8, fontWeight:800, fontSize:11, cursor:'pointer', transition:'all 0.15s',
                                 background: upgradeShopOfferCount===n ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.04)',
                                 border: upgradeShopOfferCount===n ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                 color: upgradeShopOfferCount===n ? '#34d399' : 'rgba(255,255,255,0.35)',
                               }}>{n}</button>
                           ))}
                         </div>
                       </div>

                       {/* Luck selector */}
                       <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                         <label style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.12em', width:90, flexShrink:0 }}>Sorte</label>
                         <div style={{ display:'flex', gap:5 }}>
                           {(['sorte','neutro','azar'] as UpgradeLuck[]).map(l => (
                             <button key={l} onClick={() => setUpgradeShopLuck(l)}
                               style={{ padding:'5px 12px', borderRadius:10, fontWeight:800, fontSize:9, textTransform:'uppercase', letterSpacing:'0.08em', cursor:'pointer', transition:'all 0.15s',
                                 background: upgradeShopLuck===l ? luckConf[l].bg : 'rgba(255,255,255,0.04)',
                                 border: upgradeShopLuck===l ? `1px solid ${luckConf[l].border}` : '1px solid rgba(255,255,255,0.08)',
                                 color: upgradeShopLuck===l ? luckConf[l].color : 'rgba(255,255,255,0.35)',
                               }}>{luckConf[l].label}</button>
                           ))}
                         </div>
                       </div>

                       {/* Luck description */}
                       <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', lineHeight:1.5, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'8px 12px' }}>
                         {upgradeShopLuck === 'sorte' && '🍀 Itens raros têm mais chance de aparecer e recebem descontos frequentes. Sorte favorece os corajosos!'}
                         {upgradeShopLuck === 'neutro' && '⚖ Sorteio totalmente aleatório. Qualquer item pode aparecer com variação leve de preço (±20%).'}
                         {upgradeShopLuck === 'azar' && '💀 Itens comuns dominam as ofertas e os preços sobem. Só para quem aguenta o tranco.'}
                       </div>

                       {/* Generate / Reroll buttons */}
                       <div style={{ display:'flex', gap:8, marginTop:2 }}>
                         <button onClick={generateUpgradeOffers}
                           style={{ flex:1, padding:'10px 0', borderRadius:12, fontWeight:800, fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', cursor:'pointer',
                             background:'linear-gradient(135deg,rgba(16,185,129,0.5),rgba(5,150,105,0.7))',
                             border:'1px solid rgba(16,185,129,0.5)', color:'#fff',
                             boxShadow:'0 0 16px rgba(16,185,129,0.25)',
                           }} className="hover:brightness-110 transition-all">
                           <ShoppingCart style={{ width:12, height:12, display:'inline', marginRight:5 }} />
                           {upgradeShopGenerated ? 'Nova Loja' : 'Abrir Loja'}
                         </button>
                         {upgradeShopGenerated && (
                           <button onClick={rerollUpgradeShop}
                             style={{ padding:'10px 14px', borderRadius:12, fontWeight:800, fontSize:10, textTransform:'uppercase', cursor:'pointer',
                               background:'rgba(99,102,241,0.18)', border:'1px solid rgba(99,102,241,0.4)', color:'#818cf8',
                             }} className="hover:brightness-110 transition-all" title="Reroll — refaz todas as ofertas">
                             <Shuffle style={{ width:14, height:14 }} />
                           </button>
                         )}
                       </div>
                     </div>

                     {/* Currency panel */}
                     <div style={{ flex:'0 0 220px', background:'rgba(15,23,42,0.9)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:20, padding:'18px 20px', display:'flex', flexDirection:'column', gap:12, boxShadow:'0 0 20px rgba(251,191,36,0.04)' }}>
                       <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                         <Coins style={{ width:16, height:16, color:'#fbbf24' }} />
                         <span style={{ fontSize:11, fontWeight:800, color:'#fbbf24', textTransform:'uppercase', letterSpacing:'0.2em' }}>Moedas do Personagem</span>
                       </div>
                       {/* Target character — only journey party */}
                       <div>
                         <label style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 }}>Personagem (jornada)</label>
                         <select value={upgradeTargetCharId} onChange={e => setUpgradeTargetCharId(e.target.value)}
                           style={{ width:'100%', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'6px 10px', color:'#fff', fontSize:10, fontWeight:700, outline:'none' }}>
                           <option value="">— Personagem —</option>
                           {journeyParty.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                         {journeyParty.length === 0 && <p style={{ fontSize:8, color:'#f87171', marginTop:4 }}>⚠ Nenhum personagem ativo na jornada</p>}
                       </div>
                       {upgradeTargetCharId && (() => {
                         const curr = characterCurrencies[upgradeTargetCharId] || 0;
                         const selChar = journeyParty.find(c => c.id === upgradeTargetCharId);
                         return selChar ? (
                           <>
                             <div style={{ fontSize:36, fontWeight:900, color:'#fbbf24', fontFamily:"'JetBrains Mono',monospace", textShadow:'0 0 20px rgba(251,191,36,0.5)', lineHeight:1 }}>{curr}<span style={{ fontSize:14, color:'rgba(251,191,36,0.5)', marginLeft:6 }}>🪙</span></div>
                             <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                               {[10,25,50,100].map(v => (
                                 <button key={v} onClick={() => setCharacterCurrencies(prev => ({ ...prev, [upgradeTargetCharId]: (prev[upgradeTargetCharId]||0) + v }))}
                                   style={{ flex:'1 1 40px', padding:'4px 0', borderRadius:8, fontSize:9, fontWeight:800, textTransform:'uppercase', cursor:'pointer',
                                     background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.2)', color:'#fbbf24',
                                   }} className="hover:brightness-125 transition-all">+{v}</button>
                               ))}
                             </div>
                             <button onClick={() => setCharacterCurrencies(prev => ({ ...prev, [upgradeTargetCharId]: 0 }))}
                               style={{ padding:'4px 0', borderRadius:8, fontSize:9, fontWeight:700, textTransform:'uppercase', cursor:'pointer', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'rgba(248,113,113,0.6)' }}
                               className="hover:brightness-125 transition-all">Zerar</button>
                           </>
                         ) : null;
                       })()}
                     </div>
                   </div>

                   {/* Offers grid */}
                   {!upgradeShopGenerated && (
                     <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:'60px 0', opacity:0.35 }}>
                       <ShoppingCart style={{ width:52, height:52, color:'#34d399' }} />
                       <p style={{ fontSize:14, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'0.2em' }}>A loja está fechada</p>
                       <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>Configure as opções acima e clique em "Abrir Loja"</p>
                       {journeyParty.length === 0 && <p style={{ fontSize:11, color:'#f87171', fontWeight:700 }}>⚠ Marque personagens como "Em Jornada" para usar os upgrades</p>}
                     </div>
                   )}
                   {upgradeShopGenerated && upgradeShopOffers.length === 0 && (
                     <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'40px 0', opacity:0.4 }}>
                       <p style={{ fontSize:13, fontWeight:700, color:'#34d399', textTransform:'uppercase', letterSpacing:'0.15em' }}>Todas as ofertas foram compradas!</p>
                     </div>
                   )}
                   {upgradeShopGenerated && upgradeShopOffers.length > 0 && (
                     <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px,1fr))', gap:14 }}>
                       {upgradeShopOffers.map((offer, idx) => {
                         const rc = rarityConf[offer.rarity];
                         const icon = offerIcons[offer.type];
                         const hasDiscount = offer.priceModifier < 0.95;
                         const hasHike = offer.priceModifier > 1.05;
                         const charCurr = upgradeTargetCharId ? (characterCurrencies[upgradeTargetCharId] || 0) : 0;
                         const canBuy = upgradeTargetCharId && charCurr >= offer.finalPrice;
                         return (
                           <div key={offer.id}
                             style={{ background:rc.bg, border:`1px solid ${rc.border}`, borderRadius:18, overflow:'hidden',
                               boxShadow:`0 4px 24px rgba(0,0,0,0.6), 0 0 30px ${rc.glow}`,
                               animation:`cardDealIn 0.4s cubic-bezier(0.22,1,0.36,1) ${idx * 0.07}s both`,
                               display:'flex', flexDirection:'column',
                             }}
                           >
                             {/* Top accent */}
                             <div style={{ height:3, background:`linear-gradient(90deg, transparent, ${rc.label}, transparent)` }} />

                             {/* Card body */}
                             <div style={{ padding:'16px 16px 14px', display:'flex', flexDirection:'column', gap:10, flex:1 }}>
                               {/* Header */}
                               <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                 <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                   <div style={{ width:38, height:38, borderRadius:10, background:`${rc.label}18`, border:`1px solid ${rc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
                                   <div>
                                     <p style={{ fontSize:13, fontWeight:800, color:'#fff', textTransform:'uppercase', letterSpacing:'0.04em', lineHeight:1 }}>{offer.label}</p>
                                     <span style={{ fontSize:7, fontWeight:700, color:rc.label, background:`${rc.label}14`, border:`1px solid ${rc.border}`, borderRadius:4, padding:'1px 5px', textTransform:'uppercase', letterSpacing:'0.1em' }}>{rc.badge}</span>
                                   </div>
                                 </div>
                               </div>

                               {/* Description */}
                               <p style={{ fontSize:10, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>{offer.description}</p>

                               {/* Price */}
                               <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto', paddingTop:10, borderTop:`1px solid ${rc.border}66` }}>
                                 <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                                   {hasDiscount && (
                                     <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', textDecoration:'line-through', fontFamily:"'JetBrains Mono',monospace" }}>{offer.basePrice}🪙</span>
                                   )}
                                   <span style={{ fontSize:18, fontWeight:900, color: hasDiscount ? '#34d399' : hasHike ? '#f87171' : '#fbbf24', fontFamily:"'JetBrains Mono',monospace", textShadow:`0 0 12px ${hasDiscount ? 'rgba(52,211,153,0.5)' : hasHike ? 'rgba(248,113,113,0.4)' : 'rgba(251,191,36,0.4)'}` }}>{offer.finalPrice}🪙</span>
                                 </div>
                                 {/* Price modifier badge */}
                                 <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                   {hasDiscount && (
                                     <span style={{ fontSize:8, fontWeight:800, color:'#34d399', background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:6, padding:'2px 6px', display:'flex', alignItems:'center', gap:3 }}>
                                       <TrendingDown style={{ width:8, height:8 }} />-{Math.round((1-offer.priceModifier)*100)}%
                                     </span>
                                   )}
                                   {hasHike && (
                                     <span style={{ fontSize:8, fontWeight:800, color:'#f87171', background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:6, padding:'2px 6px', display:'flex', alignItems:'center', gap:3 }}>
                                       <TrendingUp style={{ width:8, height:8 }} />+{Math.round((offer.priceModifier-1)*100)}%
                                     </span>
                                   )}
                                   {!hasDiscount && !hasHike && (
                                     <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.25)', padding:'2px 6px' }}>preço normal</span>
                                   )}
                                 </div>
                               </div>

                               {/* Buy button */}
                               <button
                                 onClick={() => upgradeTargetCharId && purchaseUpgrade(offer, upgradeTargetCharId)}
                                 disabled={!canBuy}
                                 style={{ width:'100%', padding:'9px 0', borderRadius:10, fontWeight:800, fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', cursor: canBuy ? 'pointer' : 'not-allowed',
                                   background: canBuy ? `linear-gradient(135deg,${rc.label}44,${rc.label}22)` : 'rgba(255,255,255,0.03)',
                                   border: canBuy ? `1px solid ${rc.border}` : '1px solid rgba(255,255,255,0.07)',
                                   color: canBuy ? rc.label : 'rgba(255,255,255,0.2)',
                                   transition:'all 0.2s',
                                 }} className="hover:brightness-125">
                                 {!upgradeTargetCharId ? '— Selecione um personagem —' : charCurr < offer.finalPrice ? `❌ Faltam ${offer.finalPrice - charCurr}🪙` : `✦ Comprar para ${characters.find(c=>c.id===upgradeTargetCharId)?.name || '...'}`}
                               </button>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}

                   {/* Rarities legend */}
                   {upgradeShopGenerated && (
                     <div style={{ display:'flex', gap:8, flexWrap:'wrap', opacity:0.55 }}>
                       <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.12em', alignSelf:'center' }}>Raridades:</span>
                       {Object.entries(rarityConf).map(([k,v]) => (
                         <span key={k} style={{ fontSize:8, fontWeight:700, color:v.label, background:`${v.label}12`, border:`1px solid ${v.border}`, borderRadius:5, padding:'2px 7px', textTransform:'uppercase' }}>{v.badge}</span>
                       ))}
                     </div>
                   )}
                 </div>
               );
             })()}

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
             ABA COMBATE — REDESIGN V2
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'combat' && combat && (
          <div className={`flex flex-col gap-0 anim-fade`} style={{ height: 'calc(100% + 2.5rem + 1.25rem)', marginTop: '-1.25rem', marginLeft: '-2rem', marginRight: '-2rem', overflow: 'hidden' }}>

            {/* ══ CENTRO: ARENA + SIDEBAR ══════════════════════════════════ */}
            <div className="flex-1 flex min-h-0" style={{ position:'relative' }}>

              {/* ══ FAIXA DE INICIATIVA — Overlay flutuante, hover/pin ══ */}
              <div
                style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 60, pointerEvents: 'none' }}
                onMouseEnter={() => setInitiativeStripHovered(true)}
                onMouseLeave={() => setInitiativeStripHovered(false)}
              >
                {/* Thin hover-trigger line */}
                <div style={{ height: 8, pointerEvents: 'auto', cursor: 'pointer', position: 'relative' }}>
                  {!initiativeStripPinned && !initiativeStripHovered && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 80, height: 3, borderRadius: 99, background: 'rgba(201,152,58,0.5)', boxShadow: '0 0 8px rgba(201,152,58,0.4)' }} />
                    </div>
                  )}
                </div>

                {/* Floating cards strip — visible when hovered or pinned */}
                {(initiativeStripPinned || initiativeStripHovered) && (
                  <div
                    style={{
                      padding: '6px 18px 10px',
                      background: 'transparent',
                      position: 'relative',
                      pointerEvents: 'auto',
                    }}
                    onClick={() => setInitiativeStripPinned(v => !v)}
                  >
                    {/* Pin indicator */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                      <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: initiativeStripPinned ? 'var(--gold-mid)' : 'var(--text-faint)', background: initiativeStripPinned ? 'rgba(201,152,58,0.25)' : 'rgba(0,0,0,0.55)', border: `1px solid ${initiativeStripPinned ? 'rgba(201,152,58,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 99, padding: '2px 12px', backdropFilter: 'blur(8px)' }}>
                        {initiativeStripPinned ? '📌 Fixado — clique para soltar' : '🖱 Ordem de Iniciativa · clique para fixar'}
                      </div>
                    </div>
                    {/* — Combatant cards strip — */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar items-stretch py-0.5" style={{ scrollSnapType: 'x mandatory' }}
                      onDragOver={e => e.preventDefault()}
                      onClick={e => e.stopPropagation()}
                      onDrop={() => {
                        if (dragSrcIdx === null || dragOverIdx === null || dragSrcIdx === dragOverIdx) {
                          setDragSrcIdx(null); setDragOverIdx(null); return;
                        }
                        const newCombatants = [...combat.combatants];
                        const srcCombatant = newCombatants.splice(dragSrcIdx, 1)[0];
                        newCombatants.splice(dragOverIdx, 0, srcCombatant);
                        const currentActorId = combat.combatants[combat.turnIndex]?.combatId;
                        const newTurnIndex = newCombatants.findIndex(c => c.combatId === currentActorId);
                        updateCombat({ ...combat, combatants: newCombatants, turnIndex: newTurnIndex >= 0 ? newTurnIndex : 0 });
                        setDragSrcIdx(null); setDragOverIdx(null);
                      }}
                    >
                      {filteredCombatants.length === 0 && (
                        <div className="flex items-center" style={{ color: 'var(--text-faint)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', padding: '8px 4px' }}>Nenhum combatente</div>
                      )}
                      {filteredCombatants.map((c) => {
                        const realIdx = combat.combatants.findIndex(cb => cb.combatId === c.combatId);
                        const isTurn = realIdx === combat.turnIndex && combat.isActive;
                        const isSelected = selectedCombatantId === c.combatId;
                        const isDefeated = c.currentHp <= 0;
                        const hpPct = Math.max(0, c.maxHp > 0 ? (c.currentHp / c.maxHp) * 100 : 0);
                        const auraPct = Math.max(0, c.maxAura > 0 ? (c.currentAura / c.maxAura) * 100 : 0);
                        const isDanger = hpPct > 0 && hpPct <= 30;
                        const isUnionModeSelected = unionMode && unionSelecting.includes(c.combatId);
                        const isMassDmgTarget = massDmgTargets.includes(c.combatId);
                        const activeForma = (combat.activeForms || []).find(f => f.combatantId === c.combatId);
                        const formaIcon = activeForma?.iconOverride || null;
                        const formaColor = activeForma?.color || null;
                        return (
                          <div key={isTurn ? `turn-${c.combatId}-${turnChangeKey}` : c.combatId} draggable
                            onDragStart={() => { setDragSrcIdx(realIdx); setDragOverIdx(realIdx); }}
                            onDragEnter={() => setDragOverIdx(realIdx)}
                            onDragEnd={() => { setDragSrcIdx(null); setDragOverIdx(null); }}
                            onClick={() => {
                              if (showMassDmgPanel) setMassDmgTargets(prev => prev.includes(c.combatId) ? prev.filter(id => id !== c.combatId) : [...prev, c.combatId]);
                              else handleInitiativeStripClick(c.combatId);
                            }}
                            style={{
                              flexShrink: 0, scrollSnapAlign: 'start',
                              width: isTurn ? 196 : 152,
                              transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.15s',
                              position: 'relative', cursor: 'grab',
                              opacity: dragSrcIdx === realIdx ? 0.4 : 1,
                              transform: dragOverIdx === realIdx && dragSrcIdx !== null && dragSrcIdx !== realIdx
                                ? (dragSrcIdx < realIdx ? 'translateX(6px)' : 'translateX(-6px)') : 'none',
                              animation: isTurn ? 'turnCardPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
                            }}>
                            <div style={{
                              height: '100%', borderRadius: 12, padding: '8px 10px 9px',
                              backdropFilter: 'blur(16px)',
                              background: isMassDmgTarget
                                ? (massDmgMode === 'damage' ? 'linear-gradient(145deg,rgba(239,68,68,0.55),rgba(120,10,10,0.75))' : 'linear-gradient(145deg,rgba(34,197,94,0.5),rgba(10,80,20,0.65))')
                                : isUnionModeSelected ? 'linear-gradient(145deg,rgba(168,85,247,0.55),rgba(100,30,180,0.75))'
                                : selectingTargetFor ? 'linear-gradient(145deg,rgba(239,68,68,0.5),rgba(120,10,10,0.65))'
                                : isTurn ? 'linear-gradient(145deg,rgba(130,100,25,0.85),rgba(80,60,15,0.95))'
                                : isSelected ? 'rgba(22,27,38,0.9)' : isDefeated ? 'rgba(15,18,24,0.85)' : 'rgba(22,27,38,0.85)',
                              border: isMassDmgTarget ? `1.5px solid ${massDmgMode==='damage'?'rgba(239,68,68,0.7)':'rgba(34,197,94,0.7)'}`
                                : isUnionModeSelected ? '1.5px solid rgba(168,85,247,0.8)'
                                : selectingTargetFor ? '1.5px solid rgba(239,68,68,0.6)'
                                : isTurn ? '1.5px solid rgba(212,168,83,0.75)'
                                : isSelected ? '1.5px solid rgba(212,168,83,0.4)'
                                : '1px solid rgba(255,255,255,0.1)',
                              boxShadow: isTurn ? '0 4px 24px rgba(201,152,58,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 2px 12px rgba(0,0,0,0.5)',
                              filter: isDefeated ? 'grayscale(0.8) opacity(0.5)' : 'none',
                              overflow: 'hidden', position: 'relative',
                              transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                            }}>
                              {isTurn && <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 40% 0%, rgba(212,168,83,0.18) 0%, transparent 65%)', pointerEvents:'none' }} />}
                              {isTurn && <div style={{ position:'absolute', top:0, left:0, right:0, height:2.5, background:'linear-gradient(90deg,transparent,#c9983a,#f0c060,#c9983a,transparent)' }} />}
                              {dragSrcIdx === null && <div style={{ position:'absolute', top:5, left:'50%', transform:'translateX(-50%)', display:'flex', gap:2.5, pointerEvents:'none', opacity:0.2 }}>{[0,1,2].map(i=><div key={i} style={{width:3,height:3,borderRadius:'50%',background:'white'}}/>)}</div>}
                              {dragOverIdx === realIdx && dragSrcIdx !== null && dragSrcIdx !== realIdx && <div style={{ position:'absolute', inset:0, borderRadius:12, border:'2px dashed rgba(212,168,83,0.9)', pointerEvents:'none', zIndex:10 }} />}
                              <div style={{ position:'absolute', top:6, right:7, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color: isTurn ? '#d4a853' : 'var(--text-faint)' }}>{c.initiativeResult}</div>
                              <div className="flex items-center gap-2 mb-2">
                                <div style={{ position:'relative', flexShrink:0 }}>
                                  <div style={{ width:38, height:38, borderRadius:10, overflow:'hidden', border: formaColor ? `2px solid ${formaColor}` : isTurn ? '2px solid rgba(212,168,83,0.85)' : hpPct>0&&hpPct<=30 ? '2px solid rgba(239,68,68,0.9)' : '2px solid rgba(255,255,255,0.15)', boxShadow: isTurn ? '0 0 12px rgba(201,152,58,0.7)' : hpPct>0&&hpPct<=30 ? '0 0 12px rgba(239,68,68,0.8)' : 'none' }}>
                                    <img src={(formaIcon||c.icon)||undefined} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                  </div>
                                  {isTurn && <div style={{ position:'absolute', bottom:-3, right:-3, width:12, height:12, background:'#c9983a', borderRadius:'50%', border:'2px solid rgba(22,27,38,0.99)', display:'flex', alignItems:'center', justifyContent:'center' }}><Swords style={{width:6,height:6,color:'white'}}/></div>}
                                  {isDefeated && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}><Skull style={{width:14,height:14,color:'#f87171'}}/></div>}
                                </div>
                                <div style={{ minWidth:0, flex:1, paddingRight:14 }}>
                                  <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: formaColor ? formaColor : isTurn?'#fdf0cc':isDefeated?'#334155':'#cbd5e1', textDecoration:isDefeated?'line-through':'none', lineHeight:1.1 }}>{c.name}</p>
                                  {(c.conditions||[]).length>0&&<div style={{display:'flex',gap:2,flexWrap:'nowrap',overflow:'hidden',marginTop:2}}>{c.conditions.slice(0,2).map(cd=>{const preset=PRESET_CONDITIONS.find(p=>p.name===cd.name);return(<span key={cd.name} style={{fontSize:7,fontWeight:700,textTransform:'uppercase',background:preset?`${preset.color}22`:'rgba(220,38,38,0.2)',color:preset?preset.color:'#fca5a5',border:`1px solid ${preset?preset.color+'44':'rgba(220,38,38,0.25)'}`,borderRadius:3,padding:'1px 4px',whiteSpace:'nowrap'}}>{preset?preset.emoji+' ':''}{cd.name}·{cd.duration}</span>);})}</div>}
                                  {isDefeated&&<div style={{marginTop:2,background:'linear-gradient(90deg,rgba(127,0,0,0.8),rgba(200,20,20,0.9),rgba(127,0,0,0.8))',border:'1px solid rgba(239,68,68,0.5)',borderRadius:4,padding:'2px 6px',display:'inline-flex',alignItems:'center',gap:3}}><Skull style={{width:7,height:7,color:'#fca5a5'}}/><span style={{fontSize:7,fontWeight:900,color:'#fca5a5',textTransform:'uppercase',letterSpacing:'0.18em'}}>Derrotado</span></div>}
                                </div>
                              </div>
                              <div style={{ marginBottom:4 }}>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2.5 }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:4 }}><Heart style={{width:9,height:9,color:isDanger?'#f87171':'#4e5f7a'}}/><span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.10em',color:isDanger?'#f87171':'var(--text-muted)'}}>HP</span></div>
                                  <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:isDanger?'#f87171':'var(--text-secondary)' }}>{c.currentHp}/{c.maxHp}</span>
                                </div>
                                <div style={{ height:4, background:'rgba(0,0,0,0.55)', borderRadius:99, overflow:'hidden' }}>
                                  <div style={{ height:'100%', borderRadius:99, width:`${hpPct}%`, transition:'width 0.5s ease', background:isDanger?'#ef4444':hpPct>60?'#22c55e':'#f59e0b', boxShadow:isDanger?'0 0 5px rgba(239,68,68,0.7)':'none' }} />
                                </div>
                              </div>
                              <div>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2.5 }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:4 }}><Zap style={{width:9,height:9,color:'var(--gold-dim)'}}/><span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.10em',color:'var(--text-muted)'}}>Aura</span></div>
                                  <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'var(--gold-mid)' }}>{c.currentAura}/{c.maxAura}</span>
                                </div>
                                <div style={{ height:4, background:'rgba(0,0,0,0.55)', borderRadius:99, overflow:'hidden' }}>
                                  <div style={{ height:'100%', borderRadius:99, width:`${auraPct}%`, transition:'width 0.5s ease', background:'linear-gradient(90deg,#b8892e,#d4a853)', boxShadow:'0 0 4px rgba(201,152,58,0.5)' }} />
                                </div>
                              </div>
                              {(c.maxAmmo||0)>0&&<div style={{marginTop:4,display:'flex',alignItems:'center',gap:4}}><span style={{fontSize:10}}>🎯</span><span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:'#f97316'}}>{c.currentAmmo??0}/{c.maxAmmo}</span></div>}
                              {(c.stacks||[]).length>0&&<div style={{marginTop:4,display:'flex',flexDirection:'column',gap:3}}>{(c.stacks||[]).map((stack:CharacterStack)=>{const pct=stack.max>0?Math.min(1,stack.current/stack.max):0;return(<div key={stack.id}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:1.5}}><span style={{fontSize:7,fontWeight:700,color:stack.color,textTransform:'uppercase',letterSpacing:'0.1em'}}>{stack.name}</span><span style={{fontSize:8,fontWeight:800,color:stack.color,fontFamily:"'JetBrains Mono',monospace"}}>{stack.current}/{stack.max}</span></div><div style={{height:3,background:'rgba(0,0,0,0.5)',borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',width:`${pct*100}%`,background:stack.color,borderRadius:99,transition:'width 0.3s ease'}}/></div></div>);})}</div>}
                              <div style={{ display:'flex', gap:4, marginTop:6 }}>
                                <button onClick={e=>{e.stopPropagation();setManagingConditionsCharId(c.combatId);}} style={{flex:1,fontSize:8,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'3px 0',textAlign:'center'}} className="hover:text-amber-400 hover:border-amber-700/50 transition-colors">+ Cond.</button>
                                <button onClick={e=>{e.stopPropagation();updateCombat({...combat,combatants:combat.combatants.filter(cb=>cb.combatId!==c.combatId)});}} style={{padding:'3px 7px',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,color:'var(--text-faint)',display:'flex',alignItems:'center',justifyContent:'center'}} className="hover:text-rose-400 hover:border-rose-800/40 transition-colors"><Trash2 style={{width:9,height:9}}/></button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* ══ END FAIXA DE INICIATIVA ══ */}

              {/* — LEFT SIDEBAR — */}
              <div style={{
                width: (showLeftSidebar && !gridFullscreen) ? 262 : 0,
                flexShrink: 0,
                overflow: 'hidden',
                transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
              }}>
                <div className="hidden lg:flex flex-col h-full overflow-y-auto custom-scroll" style={{
                  width: 262,
                  background:'var(--bg-surface)', borderRight:'1px solid var(--border-faint)'
                }}>

                {/* ── Sidebar Tab Nav ───────────────── */}
                <div style={{ display:'flex', gap:0, padding:'8px 8px 0', borderBottom:'1px solid var(--border-faint)', flexShrink:0 }}>
                  {([
                    { key:'status', icon:<Activity className="w-3.5 h-3.5"/>, label:'Status' },
                    { key:'unions', icon:<Users className="w-3.5 h-3.5"/>, label:'Uniões' },
                    { key:'dice',   icon:<Dices className="w-3.5 h-3.5"/>, label:'Dados' },
                    { key:'notes',  icon:<ScrollText className="w-3.5 h-3.5"/>, label:'Notas' },
                  ] as const).map(t => (
                    <button key={t.key} onClick={() => setLeftSidebarTab(t.key)}
                      style={{
                        flex:1, padding:'6px 4px', borderRadius:'8px 8px 0 0',
                        fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
                        display:'flex', flexDirection:'column', alignItems:'center', gap:3, border:'none',
                        background: leftSidebarTab === t.key ? 'var(--bg-raised)' : 'transparent',
                        color: leftSidebarTab === t.key ? 'var(--gold-mid)' : 'var(--text-muted)',
                        borderBottom: leftSidebarTab === t.key ? '2px solid var(--gold-mid)' : '2px solid transparent',
                      }}
                    >{t.icon}{t.label}</button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scroll p-2.5 flex flex-col gap-2">

                {/* ── STATUS TAB ──────────────────── */}
                {leftSidebarTab === 'status' && (<>

                  {/* Global bonus */}
                  <div className="sidebar-panel">
                    <p className="sidebar-section-title"><Zap className="w-3 h-3 text-amber-500"/>Bônus Global</p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.3)', border:'1px solid var(--border-faint)', borderRadius:10, padding:'2px 2px' }}>
                      <button onClick={()=>updateCombat({...combat,globalBonus:combat.globalBonus-1})} style={{ padding:'8px 12px', color:'var(--text-muted)', borderRadius:8 }} className="hover:bg-amber-600/20 hover:text-white transition-colors"><Minus style={{width:14,height:14}}/></button>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:26, color: combat.globalBonus!==0?'var(--gold-bright)':'var(--text-faint)' }}>
                        {combat.globalBonus>0?`+${combat.globalBonus}`:combat.globalBonus}
                      </span>
                      <button onClick={()=>updateCombat({...combat,globalBonus:combat.globalBonus+1})} style={{ padding:'8px 12px', color:'var(--text-muted)', borderRadius:8 }} className="hover:bg-amber-600/20 hover:text-white transition-colors"><Plus style={{width:14,height:14}}/></button>
                    </div>
                  </div>

                  {/* Mass damage panel */}
                  <div className="sidebar-panel">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: showMassDmgPanel ? 10 : 0 }}>
                      <p className="sidebar-section-title" style={{ marginBottom:0 }}><ShieldAlert className="w-3 h-3 text-rose-400"/>Dano em Massa</p>
                      <button onClick={() => setShowMassDmgPanel(v => !v)} style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:6, background: showMassDmgPanel ? 'rgba(201,152,58,0.15)' : 'var(--bg-raised)', border:'1px solid var(--border-faint)', color: showMassDmgPanel ? 'var(--gold-mid)' : 'var(--text-muted)' }}>
                        {showMassDmgPanel ? '▲ Fechar' : '▼ Abrir'}
                      </button>
                    </div>
                    {showMassDmgPanel && (<>
                      <div style={{ display:'flex', gap:4, marginBottom:8 }}>
                        {(['damage','heal'] as const).map(m => (
                          <button key={m} onClick={() => setMassDmgMode(m)} style={{ flex:1, padding:'5px 0', borderRadius:7, fontSize:10, fontWeight:700, textTransform:'uppercase', cursor:'pointer', border:'1px solid', background: massDmgMode === m ? (m==='damage' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)') : 'transparent', borderColor: massDmgMode === m ? (m==='damage' ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.5)') : 'var(--border-faint)', color: massDmgMode === m ? (m==='damage' ? '#f87171' : '#86efac') : 'var(--text-muted)' }}>
                            {m === 'damage' ? '⚔ Dano' : '❤ Cura'}
                          </button>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                        <input type="number" value={massDmgAmount} onChange={e => setMassDmgAmount(e.target.value)} placeholder="Qtd" min="0"
                          style={{ flex:1, background:'rgba(0,0,0,0.4)', border:'1px solid var(--border-faint)', borderRadius:8, padding:'7px 10px', fontSize:14, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:'var(--text-primary)', outline:'none', textAlign:'center' }} />
                        <button onClick={applyMassDamage} disabled={!massDmgAmount || massDmgTargets.length === 0}
                          style={{ padding:'7px 12px', borderRadius:8, fontSize:11, fontWeight:700, background: massDmgMode === 'damage' ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)', border:`1px solid ${massDmgMode==='damage'?'rgba(239,68,68,0.5)':'rgba(34,197,94,0.5)'}`, color: massDmgMode === 'damage' ? '#f87171' : '#86efac', opacity: (!massDmgAmount || massDmgTargets.length === 0) ? 0.4 : 1, cursor: (!massDmgAmount || massDmgTargets.length === 0) ? 'not-allowed' : 'pointer' }}>
                          ✓ Aplicar
                        </button>
                      </div>
                      <p style={{ fontSize:10, color:'var(--text-muted)', marginBottom:5 }}>Alvos ({massDmgTargets.length}): clique nos combatentes acima</p>
                      {massDmgTargets.length > 0 && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                          {massDmgTargets.map(id => {
                            const cb = combat.combatants.find(c=>c.combatId===id);
                            return cb ? <span key={id} style={{ fontSize:9, fontWeight:700, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:5, padding:'2px 7px', color:'#f87171' }}>{cb.name.split(' ')[0]}</span> : null;
                          })}
                          <button onClick={() => setMassDmgTargets([])} style={{ fontSize:9, color:'var(--text-muted)', padding:'2px 5px' }}>✕</button>
                        </div>
                      )}
                    </>)}
                  </div>

                </>)}

                {/* ── UNIONS TAB ──────────────────── */}
                {leftSidebarTab === 'unions' && (
                  <div className="sidebar-panel flex flex-col gap-3">
                    <p className="sidebar-section-title"><Users className="w-3 h-3 text-purple-400"/>Uniões de Combate</p>
                    {(combat.unions || []).map(u => {
                      const members = combat.combatants.filter(c => u.combatantIds.includes(c.combatId));
                      return (
                        <div key={u.id} style={{ background:'var(--bg-raised)', border:`1px solid ${u.color}44`, borderRadius:9, padding:'9px 11px' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                            <div style={{ display:'flex', gap:4 }}>
                              {members.map(m => (
                                <div key={m.combatId} style={{ width:22, height:22, borderRadius:'50%', overflow:'hidden', border:`2px solid ${u.color}`, flexShrink:0 }}>
                                  <img src={m.icon||null} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                </div>
                              ))}
                            </div>
                            <button onClick={() => breakUnion(u.id)} style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', color:'var(--text-muted)', padding:'2px 7px', borderRadius:5, border:'1px solid var(--border-faint)', background:'var(--bg-overlay)', cursor:'pointer' }} className="hover:text-rose-400">Desfazer</button>
                          </div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {members.map(m => m.name.split(' ')[0]).join(' + ')}
                          </div>
                        </div>
                      );
                    })}
                    {unionMode ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:7, padding:'10px', background:'rgba(168,85,247,0.05)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:10 }}>
                        <p style={{ fontSize:11, color:'#a855f7', fontWeight:700 }}>Clique nos combatentes para selecioná-los ({unionSelecting.length} sel.)</p>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                          {['#a855f7','#ef4444','#22c55e','#3b82f6','#f59e0b','#ec4899'].map(col => (
                            <button key={col} onClick={() => setUnionColor(col)} style={{ width:18, height:18, borderRadius:'50%', background:col, border: unionColor===col ? '2px solid white' : '2px solid transparent', cursor:'pointer' }} />
                          ))}
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={createUnion} disabled={unionSelecting.length < 2} style={{ flex:1, padding:'7px', borderRadius:8, fontSize:11, fontWeight:700, textTransform:'uppercase', background: unionSelecting.length >= 2 ? `${unionColor}22` : 'rgba(0,0,0,0.3)', border:`1px solid ${unionSelecting.length >= 2 ? unionColor+'55' : 'var(--border-faint)'}`, color: unionSelecting.length >= 2 ? unionColor : 'var(--text-faint)', cursor: unionSelecting.length >= 2 ? 'pointer' : 'not-allowed' }}>✓ Criar</button>
                          <button onClick={() => { setUnionMode(false); setUnionSelecting([]); }} style={{ padding:'7px 12px', borderRadius:8, fontSize:11, fontWeight:700, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', cursor:'pointer' }}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setUnionMode(true)} style={{ padding:'9px', borderRadius:9, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.25)', color:'#a855f7', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                        <Plus style={{width:11,height:11}}/> Nova União
                      </button>
                    )}
                    {(combat.unions || []).length === 0 && !unionMode && <p style={{ fontSize:11, color:'var(--text-faint)', textAlign:'center', padding:'8px 0' }}>Nenhuma união ativa</p>}
                  </div>
                )}

                {/* ── DICE TAB ────────────────────── */}
                {leftSidebarTab === 'dice' && (
                  <div className="sidebar-panel flex flex-col gap-3">
                    <p className="sidebar-section-title"><Dices className="w-3 h-3 text-amber-400"/>Dados Rápidos</p>
                    {combatQuickRoll && (
                      <div style={{ textAlign:'center', padding:'12px', background:'rgba(201,152,58,0.1)', border:'1px solid rgba(201,152,58,0.25)', borderRadius:12, marginBottom:4 }}>
                        <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:4 }}>d{combatQuickRoll.sides}</p>
                        <p style={{ fontSize:42, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: combatQuickRoll.result === combatQuickRoll.sides ? '#f0c060' : combatQuickRoll.result === 1 ? '#f87171' : 'var(--text-primary)', lineHeight:1 }}>
                          {combatQuickRoll.result}
                        </p>
                        {combatQuickRoll.result === combatQuickRoll.sides && <p style={{ fontSize:9, color:'var(--gold-mid)', fontWeight:700, marginTop:3 }}>⚡ CRÍTICO!</p>}
                        {combatQuickRoll.result === 1 && <p style={{ fontSize:9, color:'#f87171', fontWeight:700, marginTop:3 }}>💀 FALHA CRÍTICA</p>}
                      </div>
                    )}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6 }}>
                      {[4,6,8,10,12,20].map(s => (
                        <button key={s} onClick={() => doQuickCombatRoll(s)}
                          style={{ padding:'10px 6px', borderRadius:9, fontSize:12, fontWeight:700, textTransform:'uppercase', background:'var(--bg-raised)', border:'1px solid var(--border-mid)', color:'var(--text-secondary)', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}
                          className="hover:border-amber-700/60 hover:text-amber-300 hover:bg-amber-900/10 transition-all">
                          <Dices style={{width:14,height:14}}/>
                          d{s}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => doQuickCombatRoll(100)} style={{ padding:'8px', borderRadius:9, fontSize:11, fontWeight:700, background:'var(--bg-raised)', border:'1px solid var(--border-mid)', color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }} className="hover:border-amber-700/50 hover:text-amber-300 transition-all">
                      <Dices style={{width:12,height:12}}/> d100
                    </button>
                  </div>
                )}

                {/* ── NOTES TAB ───────────────────── */}
                {leftSidebarTab === 'notes' && (
                  <div className="sidebar-panel flex flex-col gap-2" style={{ flex:1, minHeight:0 }}>
                    <p className="sidebar-section-title"><ScrollText className="w-3 h-3 text-amber-400"/>Notas do Combate</p>
                    <textarea
                      className="combat-notes custom-scroll"
                      style={{ flex:1, minHeight:240, resize:'none' }}
                      value={combatNotes}
                      onChange={e => setCombatNotes(e.target.value)}
                      placeholder="Anotações de combate, estratégias, loot, etc..."
                    />
                    <p style={{ fontSize:9, color:'var(--text-faint)', textAlign:'right' }}>{combatNotes.length} chars</p>
                  </div>
                )}

                </div>
                </div>
              </div>

              {/* — LEFT SIDEBAR TOGGLE — */}
              <button
                onClick={() => setShowLeftSidebar(v => !v)}
                style={{
                  position:'absolute', left: showLeftSidebar ? 254 : 0, top:'50%',
                  transform:'translateY(-50%)',
                  zIndex:20, width:18, height:48,
                  background:'var(--bg-surface)',
                  border:'1px solid var(--border-faint)',
                  borderLeft: showLeftSidebar ? 'none' : '1px solid var(--border-faint)',
                  borderRight: showLeftSidebar ? '1px solid var(--border-faint)' : 'none',
                  borderRadius: '0 8px 8px 0',
                  color:'var(--text-faint)', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'left 0.3s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow:'2px 0 8px rgba(0,0,0,0.3)',
                }}
                className="hover:bg-amber-900/20 hover:text-amber-400 transition-colors"
                title={showLeftSidebar ? 'Ocultar painel esquerdo' : 'Mostrar painel esquerdo'}
              >
                <ChevronLeft style={{ width:11, height:11, transform: showLeftSidebar ? 'none' : 'rotate(180deg)', transition:'transform 0.3s ease' }} />
              </button>
              <div className="flex-1 relative overflow-hidden" style={{ background:'radial-gradient(ellipse at 50% 30%, var(--bg-raised) 0%, var(--bg-base) 70%)', ...(gridFullscreen ? { position:'fixed', inset:0, zIndex:9999, width:'100vw', height:'100vh' } : {}) }}>

                {/* Atmospheric grid dots */}
                <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.025, backgroundImage:'radial-gradient(rgba(201,152,58,1) 1px, transparent 1px)', backgroundSize:'24px 24px' }} />
                <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse at 50% 0%, rgba(201,152,58,0.05) 0%, transparent 55%)' }} />
                {/* Bottom vignette — z-index BELOW grid (zIndex:1) to not block clicks */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:200, pointerEvents:'none', background:'linear-gradient(0deg, rgba(8,10,16,0.45) 0%, rgba(8,10,16,0.15) 50%, transparent 100%)', zIndex:1 }} />

                {/* Fullscreen toggle button */}
                <button onClick={() => setGridFullscreen(v => !v)} title={gridFullscreen ? 'Sair da tela cheia (ESC)' : 'Tela cheia'} style={{ position:'absolute', top:8, right:8, zIndex:40, background:'rgba(22,27,38,0.92)', border:'1px solid var(--border-gold)', borderRadius:9, padding:'6px 10px', color:'var(--gold-mid)', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }} className="hover:bg-amber-900/30 hover:text-amber-300 transition-colors">
                  <Maximize2 style={{width:11,height:11}}/> {gridFullscreen ? 'Sair (ESC)' : 'Tela Cheia'}
                </button>

                {/* Grid coords toggle */}
                <button onClick={() => setShowGridCoords(v => !v)} title="Mostrar/ocultar coordenadas" style={{ position:'absolute', top:8, right:115, zIndex:40, background: showGridCoords ? 'rgba(52,211,153,0.18)' : 'rgba(22,27,38,0.92)', border:`1px solid ${showGridCoords ? 'rgba(52,211,153,0.5)' : 'var(--border-faint)'}`, borderRadius:9, padding:'6px 10px', color: showGridCoords ? '#34d399' : 'var(--text-faint)', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }} className="hover:bg-slate-800 transition-colors">
                  <Grid3X3 style={{width:11,height:11}}/>
                </button>

                {/* Background image button */}
                <div style={{ position:'absolute', top:8, right:155, zIndex:40 }}>
                  <BgImageButton backgroundImage={combat.backgroundImage || ''} onUpdate={val => updateCombat({...combat, backgroundImage: val})} />
                </div>

                {/* Pin placement mode indicator */}
                {placingPin && (
                  <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', zIndex:40, background:'rgba(20,24,34,0.92)', border:`2px solid ${placingPin.color}`, borderRadius:99, padding:'6px 16px', color: placingPin.color, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.2em', boxShadow:`0 0 20px ${placingPin.color}55`, display:'flex', alignItems:'center', gap:6 }}>
                    <MapPin style={{width:12,height:12}}/> Clique no grid para posicionar · ESC para cancelar
                  </div>
                )}

                {/* Drag mode indicator */}
                {gridDragCombatId && (() => {
                  const dragging = combat.combatants.find(c => c.combatId === gridDragCombatId);
                  const from = dragging?.gridPos;
                  const to = gridDragOverCell;
                  const squares = to && from ? Math.abs(to.x - from.x) + Math.abs(to.y - from.y) : 0;
                  return (
                    <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', zIndex:40, background:'rgba(20,24,34,0.94)', border:'2px solid rgba(52,211,153,0.7)', borderRadius:99, padding:'6px 18px', color:'#34d399', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.15em', boxShadow:'0 0 24px rgba(52,211,153,0.35)', display:'flex', alignItems:'center', gap:8 }}>
                      <Move style={{width:12,height:12}}/>
                      {dragging?.name.split(' ')[0]} → {squares > 0 ? `${squares} quadrado${squares !== 1 ? 's' : ''}` : 'solte para mover'}
                    </div>
                  );
                })()}

                {/* Inner arena container */}
                <div className="w-full h-full flex items-center justify-center overflow-auto no-scrollbar" style={{ paddingTop: 16, paddingLeft: 16, paddingRight: 16, paddingBottom: 20 }}>
                  <div style={{
                    position:'relative', overflow:'visible',
                    width:`${combat.visualWidthPct||100}%`,
                    height: combat.maintainAspectRatio ? 'auto' : `${combat.visualHeightPx||600}px`,
                    aspectRatio: (combat.maintainAspectRatio && bgAspectRatio) ? `${bgAspectRatio}` : 'unset',
                    backgroundImage: combat.backgroundImage ? `url(${combat.backgroundImage})` : (journey?.image ? `url(${journey.image})` : 'none'),
                    backgroundSize:'100% 100%', backgroundPosition:'center',
                    borderRadius:16,
                    boxShadow:'0 0 0 2px rgba(212,168,83,0.18), 0 0 60px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.03)',
                    transition:'width 0.3s ease, height 0.3s ease',
                    clipPath: 'inset(0 round 16px)',
                  }}>
                    {/* Default arena bg when no image */}
                    {!combat.backgroundImage && !journey?.image && (
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(145deg, #1e180e 0%, #100e08 100%)', borderRadius:16 }}>
                        {/* Grid lines drawn via CSS */}
                        <div style={{ position:'absolute', inset:0, borderRadius:16, overflow:'hidden', opacity:0.08, backgroundImage:`linear-gradient(rgba(212,168,83,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.8) 1px, transparent 1px)`, backgroundSize:`${100/(combat.gridWidth||10)}% ${100/(combat.gridHeight||10)}%` }} />
                        {/* Corner decorations */}
                        {(['top-2 left-2','top-2 right-2','bottom-2 left-2','bottom-2 right-2'] as const).map(pos=>(
                          <div key={pos} className={`absolute ${pos} w-6 h-6`} style={{ border:'1px solid rgba(180,140,40,0.2)', borderRadius:4 }} />
                        ))}
                      </div>
                    )}

                    {/* Grid lines overlay (always visible faintly when image present) */}
                    {(combat.backgroundImage || journey?.image) && (
                      <div style={{ position:'absolute', inset:0, borderRadius:16, pointerEvents:'none', zIndex:2, backgroundImage:`linear-gradient(rgba(212,168,83,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.08) 1px, transparent 1px)`, backgroundSize:`${100/(combat.gridWidth||10)}% ${100/(combat.gridHeight||10)}%` }} />
                    )}

                    {/* Target-select overlay */}
                    {selectingTargetFor && (
                      <div style={{ position:'absolute', inset:0, zIndex:30, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(2px)', background:'rgba(120,90,20,0.07)' }}>
                        <div style={{ background:'rgba(20,24,34,0.92)', border:'1px solid rgba(201,152,58,0.5)', borderRadius:99, padding:'10px 28px', color:'#e8c878', fontWeight:700, fontSize:12, textTransform:'uppercase', letterSpacing:'0.35em', boxShadow:'0 0 30px rgba(201,152,58,0.25)', animation:'danger-pulse 2s ease-in-out infinite' }}>
                          ⊕ Selecione um alvo
                        </div>
                      </div>
                    )}

                    {/* Union mode overlay indicator */}
                    {unionMode && (
                      <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', zIndex:40, background:'rgba(20,24,34,0.92)', border:'2px solid rgba(168,85,247,0.6)', borderRadius:99, padding:'6px 20px', color:'#a855f7', fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'0.2em', boxShadow:'0 0 20px rgba(168,85,247,0.3)', display:'flex', alignItems:'center', gap:8, pointerEvents:'none' }}>
                        <Users style={{width:11,height:11}}/> Modo União · {unionSelecting.length} selecionados
                      </div>
                    )}

                    {/* ═══ INTERACTIVE GRID CELLS — full coverage, high zIndex ═══ */}
                    <div
                      style={{
                        position:'absolute', inset:0, zIndex: selectingTargetFor ? 25 : 15,
                        display:'grid',
                        gridTemplateColumns:`repeat(${combat.gridWidth||10},1fr)`,
                        gridTemplateRows:`repeat(${combat.gridHeight||10},1fr)`,
                      }}
                      onDragOver={e => e.preventDefault()}
                    >
                      {Array.from({length:(combat.gridWidth||10)*(combat.gridHeight||10)}).map((_,i) => {
                        const cx = i % (combat.gridWidth||10);
                        const cy = Math.floor(i / (combat.gridWidth||10));
                        const isHover = gridHoverCell?.x === cx && gridHoverCell?.y === cy;
                        const isDragTarget = gridDragOverCell?.x === cx && gridDragOverCell?.y === cy;
                        const hasToken = combat.combatants.some(c => c.gridPos.x === cx && c.gridPos.y === cy);
                        const isSelectTarget = selectingTargetFor ? 'rgba(201,152,58,0.07)' : 'transparent';
                        return (
                          <div
                            key={i}
                            onClick={() => handleGridClick(cx, cy)}
                            onMouseEnter={() => { setGridHoverCell({x:cx,y:cy}); if(gridDragCombatId) handleGridDragOverCell(cx,cy); }}
                            onMouseLeave={() => setGridHoverCell(null)}
                            onDragOver={e => { e.preventDefault(); handleGridDragOverCell(cx, cy); }}
                            onDrop={e => { e.preventDefault(); handleGridDrop(cx, cy); }}
                            style={{
                              border:'0.5px solid rgba(212,168,83,0.06)',
                              background: isDragTarget
                                ? 'rgba(52,211,153,0.2)'
                                : isHover && !selectingTargetFor && !gridDragCombatId
                                ? (hasToken ? 'rgba(212,168,83,0.08)' : 'rgba(212,168,83,0.05)')
                                : isSelectTarget,
                              cursor: gridDragCombatId ? 'copy' : placingPin ? 'crosshair' : selectingTargetFor ? 'crosshair' : 'pointer',
                              position:'relative',
                              transition:'background 0.1s',
                            }}
                          >
                            {/* Coord label */}
                            {showGridCoords && (
                              <span style={{ position:'absolute', top:1, left:2, fontSize:'min(1.4vw,9px)', fontWeight:600, color:'rgba(212,168,83,0.4)', pointerEvents:'none', fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{cx},{cy}</span>
                            )}
                            {/* Drop indicator ring */}
                            {isDragTarget && (
                              <div style={{ position:'absolute', inset:3, borderRadius:6, border:'2px dashed rgba(52,211,153,0.8)', pointerEvents:'none', animation:'turn-pulse 1s ease-in-out infinite' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Combatants — zIndex 20, above grid cells */}
                    {combat.combatants.map((c,i)=>{
                      const isCurrent = i===combat.turnIndex && combat.isActive;
                      const isSelectedOnGrid = selectedCombatantId===c.combatId;
                      const isImpacted = impactTargetId===c.combatId;
                      const isDefeated = c.currentHp<=0;
                      const cw = 100/(combat.gridWidth||10);
                      const ch = 100/(combat.gridHeight||10);
                      const hpPct = c.maxHp>0 ? (c.currentHp/c.maxHp)*100 : 0;
                      // Union info
                      const unions = combat.unions || [];
                      const memberUnion = unions.find(u => u.combatantIds.includes(c.combatId));
                      const isUnionLeader = memberUnion && memberUnion.combatantIds[0] === c.combatId;
                      const unionMemberIdx = memberUnion ? memberUnion.combatantIds.indexOf(c.combatId) : -1;
                      // Offset non-leader members slightly so icons are visible
                      const offsetX = memberUnion && !isUnionLeader ? (unionMemberIdx % 2 === 1 ? 8 : -8) : 0;
                      const offsetY = memberUnion && !isUnionLeader ? (unionMemberIdx > 1 ? 8 : -8) : 0;
                      const isUnionSelected = unionMode && unionSelecting.includes(c.combatId);
                      // Stat popups for this combatant
                      const myPopups = statPopups.filter(p => p.combatId === c.combatId);
                      // Forma info
                      const activeForms = combat.activeForms || [];
                      const myForma = activeForms.find(f => f.combatantId === c.combatId);
                      const displayIcon = myForma?.iconOverride || c.icon;
                      const formaColor = myForma?.color || null;
                      const formaColorDim = formaColor ? formaColor + '66' : null;
                      const formaColorFaint = formaColor ? formaColor + '22' : null;
                      // Drag state
                      const isBeingDragged = gridDragCombatId === c.combatId;
                      // Move history
                      const moveRecord = gridMoveHistory[c.combatId];
                      // Snap preview (dragging toward this combatant's slot)
                      const snapPos = (gridSnapPreview?.combatId === c.combatId) ? { x: gridSnapPreview.x, y: gridSnapPreview.y } : null;
                      const displayX = snapPos ? snapPos.x : c.gridPos.x;
                      const displayY = snapPos ? snapPos.y : c.gridPos.y;

                      return (
                        <div key={c.combatId}
                          className={`absolute z-20 flex items-center justify-center ${isImpacted?'animate-impact':''}`}
                          style={{
                            left:`${displayX*cw}%`, top:`${displayY*ch}%`,
                            width:`${cw}%`, height:`${ch}%`,
                            transition: isBeingDragged ? 'none' : 'left 0.38s cubic-bezier(0.22,1,0.36,1), top 0.38s cubic-bezier(0.22,1,0.36,1)',
                            pointerEvents: 'auto',
                            cursor: selectingTargetFor ? 'crosshair' : gridDragCombatId && gridDragCombatId !== c.combatId ? 'not-allowed' : 'grab',
                            opacity: isBeingDragged ? 0.35 : 1,
                            zIndex: isBeingDragged ? 5 : isCurrent ? 22 : 20,
                          }}
                          onClick={() => {
                            if (selectingTargetFor) {
                              if (selectingTargetFor.isAreaEffect) {
                                setAreaSelectedTargets(prev =>
                                  prev.includes(c.combatId) ? prev.filter(id => id !== c.combatId) : [...prev, c.combatId]
                                );
                              } else {
                                executeCardOnTarget(selectingTargetFor, 'other', c.combatId);
                              }
                              return;
                            }
                            if (unionMode) {
                              setUnionSelecting(prev =>
                                prev.includes(c.combatId) ? prev.filter(id => id !== c.combatId) : [...prev, c.combatId]
                              );
                              return;
                            }
                            setSelectedCombatantId(prev => prev === c.combatId ? null : c.combatId);
                          }}
                          draggable={!selectingTargetFor && !unionMode}
                          onDragStart={e => {
                            e.dataTransfer.effectAllowed = 'move';
                            handleGridDragStart(c.combatId);
                          }}
                          onDragEnd={handleGridDragEnd}
                        >

                          <div style={{ position:'relative', transform: `translateX(${offsetX}px) translateY(${offsetY}px) ${isCurrent?'scale(1.22)':isSelectedOnGrid?'scale(1.1)':'scale(1)'}`, transition:'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)', zIndex: isCurrent?30:20 }}>

                            {/* Outer animated ring for current turn */}
                            {isCurrent && (
                              <div style={{ position:'absolute', inset:-8, borderRadius:'50%', border:'2px solid rgba(212,168,83,0.7)', animation:'turn-pulse 2.2s ease-in-out infinite', pointerEvents:'none' }} />
                            )}
                            {/* Union ring */}
                            {memberUnion && (
                              <div style={{ position:'absolute', inset: isUnionLeader ? -10 : -6, borderRadius:'50%', border:`2px solid ${memberUnion.color}`, boxShadow:`0 0 10px ${memberUnion.color}88`, pointerEvents:'none', animation:'turn-pulse 3s ease-in-out infinite' }} />
                            )}
                            {/* Union mode selection highlight */}
                            {unionMode && (
                              <div style={{ position:'absolute', inset:-8, borderRadius:'50%', border:`2px dashed ${isUnionSelected ? '#a855f7' : 'rgba(168,85,247,0.3)'}`, boxShadow: isUnionSelected ? '0 0 16px rgba(168,85,247,0.6)' : 'none', pointerEvents:'none' }} />
                            )}
                            {/* Area multi-select highlight */}
                            {areaSelectedTargets.includes(c.combatId) && (
                              <div style={{ position:'absolute', inset:-9, borderRadius:'50%', border:'2.5px solid #fb923c', boxShadow:'0 0 20px rgba(234,88,12,0.8), 0 0 8px rgba(234,88,12,0.4)', pointerEvents:'none', animation:'turn-pulse 1.4s ease-in-out infinite' }} />
                            )}
                            {/* Selection ring */}
                            {isSelectedOnGrid && !isCurrent && (
                              <div style={{ position:'absolute', inset:-5, borderRadius:'50%', border:'2px solid rgba(52,211,153,0.7)', boxShadow:'0 0 14px rgba(52,211,153,0.45)', pointerEvents:'none', animation:'turn-pulse 1.8s ease-in-out infinite' }} />
                            )}

                            {/* Forma glow ring */}
                            {myForma && (
                              <div style={{
                                position:'absolute', inset:-10, borderRadius:'50%',
                                border:`2px solid ${formaColor}`,
                                boxShadow:`0 0 16px 4px ${formaColorDim}, 0 0 40px 8px ${formaColorFaint}`,
                                pointerEvents:'none',
                                animation:'forma-combatant-pulse 2s ease-in-out infinite',
                              }} />
                            )}

                            {/* Drag handle indicator (on hover) */}
                            {!selectingTargetFor && !unionMode && !isBeingDragged && (
                              <div style={{ position:'absolute', top:-3, right:-3, width:10, height:10, borderRadius:'50%', background:'rgba(212,168,83,0.5)', border:'1px solid rgba(212,168,83,0.8)', pointerEvents:'none', opacity: isSelectedOnGrid ? 1 : 0, transition:'opacity 0.2s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Move style={{ width:6, height:6, color:'#fff' }} />
                              </div>
                            )}

                            {/* Token */}
                            <div style={{
                              width:'min(8vw,52px)', height:'min(8vw,52px)',
                              borderRadius:'50%', overflow:'hidden',
                              border: isCurrent ? '3px solid #d4a853' : myForma ? `3px solid ${formaColor}` : areaSelectedTargets.includes(c.combatId) ? '3px solid #fb923c' : isUnionSelected ? `3px solid #a855f7` : isSelectedOnGrid ? '2.5px solid rgba(52,211,153,0.8)' : '2px solid rgba(255,255,255,0.12)',
                              boxShadow: isCurrent ? '0 0 24px rgba(201,152,58,0.8), 0 0 8px rgba(201,152,58,0.4)' : myForma ? `0 0 20px ${formaColorDim}` : areaSelectedTargets.includes(c.combatId) ? '0 0 20px rgba(234,88,12,0.7)' : isSelectedOnGrid ? '0 0 16px rgba(52,211,153,0.5)' : '0 4px 16px rgba(0,0,0,0.9)',
                              background:'var(--bg-base)',
                              filter: isDefeated ? 'grayscale(1) brightness(0.35)' : isBeingDragged ? 'brightness(0.4)' : 'none',
                              transition:'border 0.3s, box-shadow 0.3s, filter 0.2s',
                            }}>
                              <img src={displayIcon||undefined} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            </div>

                            {/* HP micro-bar beneath token */}
                            <div style={{ position:'absolute', bottom:-5, left:'8%', right:'8%', height:3, background:'rgba(0,0,0,0.8)', borderRadius:99, overflow:'hidden' }}>
                              <div style={{ height:'100%', borderRadius:99, width:`${Math.max(0,hpPct)}%`, background: hpPct<=30?'#ef4444': hpPct<=60?'#f59e0b':'#22c55e', transition:'width 0.5s ease' }} />
                            </div>

                            {/* Name label */}
                            <div style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', fontSize:8, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color: isCurrent?'#e8c878':isSelectedOnGrid?'#34d399':'rgba(255,255,255,0.4)', textShadow:'0 1px 5px rgba(0,0,0,1)', pointerEvents:'none' }}>
                              {c.name.split(' ')[0]}
                            </div>

                            {/* Position badge (shows when selected) */}
                            {isSelectedOnGrid && !isBeingDragged && (
                              <div style={{ position:'absolute', top:-20, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', fontSize:7, fontWeight:700, color:'#34d399', textShadow:'0 1px 5px rgba(0,0,0,1)', pointerEvents:'none', background:'rgba(5,25,18,0.85)', borderRadius:4, padding:'1px 4px', border:'1px solid rgba(52,211,153,0.3)' }}>
                                {c.gridPos.x},{c.gridPos.y}
                              </div>
                            )}

                            {/* Move history badge */}
                            {moveRecord && (
                              <div style={{ position:'absolute', top:-20, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', fontSize:8, fontWeight:900, color:'#67e8f9', textShadow:'0 0 8px rgba(103,232,249,0.8)', pointerEvents:'none', animation:'statPopup 4s ease forwards' }}>
                                +{moveRecord.squares}□
                              </div>
                            )}

                            {/* Death — DERROTADO overlay */}
                            {isDefeated && (
                              <div style={{ position:'absolute', inset:-2, borderRadius:'50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.65)', gap:1 }}>
                                <Skull style={{ width:'32%', height:'32%', color:'rgba(248,113,113,0.85)' }} />
                              </div>
                            )}
                            {/* DERROTADO label below token (replaces name) */}
                            {isDefeated && (
                              <div style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', fontSize:7, fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', color:'#f87171', textShadow:'0 0 8px rgba(239,68,68,0.8)', pointerEvents:'none', animation:'defeated-pulse 1.4s ease-in-out infinite' }}>
                                DERROTADO
                              </div>
                            )}

                            {/* Stat popups */}
                            {myPopups.map(popup => (
                              <div key={popup.id} style={{
                                position:'absolute', top:-28, left:'50%', transform:'translateX(-50%)',
                                fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:13,
                                color: popup.type==='hp' ? (popup.delta < 0 ? '#f87171' : '#4ade80') : popup.type==='aura' ? (popup.delta < 0 ? '#fbbf24' : '#a78bfa') : (popup.delta < 0 ? '#fb923c' : '#67e8f9'),
                                textShadow:'0 2px 8px rgba(0,0,0,1)',
                                pointerEvents:'none', whiteSpace:'nowrap',
                                animation:'statPopup 1.8s ease forwards',
                                zIndex:99,
                              }}>
                                {popup.delta > 0 ? '+' : ''}{popup.delta}{popup.type==='hp'?'♥':popup.type==='aura'?'⚡':'🎯'}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Custom Pins */}
                    {(combat.customPins || []).map(pin => {
                      const cw = 100/(combat.gridWidth||10);
                      const ch = 100/(combat.gridHeight||10);
                      return (
                        <div key={pin.id} className="absolute z-25 flex items-center justify-center" style={{ left:`${pin.gridPos.x*cw}%`, top:`${pin.gridPos.y*ch}%`, width:`${cw}%`, height:`${ch}%`, pointerEvents:'auto' }}>
                          <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center' }}>
                            <div style={{ width:22, height:22, borderRadius:'50%', background: pin.color, boxShadow:`0 0 10px ${pin.color}88, 0 2px 8px rgba(0,0,0,0.8)`, border:'2px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
                              title={`${pin.label} — clique para remover`}
                              onClick={() => updateCombat({...combat, customPins: (combat.customPins||[]).filter(p => p.id !== pin.id)})}>
                              <MapPin style={{ width:10, height:10, color:'white' }} />
                            </div>
                            {pin.label && <div style={{ marginTop:2, whiteSpace:'nowrap', fontSize:7, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color: pin.color, textShadow:'0 1px 5px rgba(0,0,0,1)', pointerEvents:'none' }}>{pin.label}</div>}
                          </div>
                        </div>
                      );
                    })}

                    {/* Grid size info badge */}
                    <div style={{ position:'absolute', bottom:6, right:8, zIndex:35, background:'rgba(8,10,16,0.7)', border:'1px solid rgba(212,168,83,0.12)', borderRadius:6, padding:'2px 7px', fontSize:8, fontWeight:600, color:'rgba(212,168,83,0.4)', fontFamily:"'JetBrains Mono',monospace", pointerEvents:'none' }}>
                      {combat.gridWidth||10}×{combat.gridHeight||10}
                    </div>
                  </div>
                </div>
              </div>

              {/* — RIGHT SIDEBAR TOGGLE — */}
              <button
                onClick={() => setShowRightSidebar(v => !v)}
                style={{
                  position:'absolute', right: showRightSidebar ? 254 : 0, top:'50%',
                  transform:'translateY(-50%)',
                  zIndex:20, width:18, height:48,
                  background:'var(--bg-surface)',
                  border:'1px solid var(--border-faint)',
                  borderRight: showRightSidebar ? 'none' : '1px solid var(--border-faint)',
                  borderLeft: showRightSidebar ? '1px solid var(--border-faint)' : 'none',
                  borderRadius: '8px 0 0 8px',
                  color:'var(--text-faint)', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'right 0.3s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow:'-2px 0 8px rgba(0,0,0,0.3)',
                }}
                className="hover:bg-amber-900/20 hover:text-amber-400 transition-colors"
                title={showRightSidebar ? 'Ocultar painel direito' : 'Mostrar painel direito'}
              >
                <ChevronRight style={{ width:11, height:11, transform: showRightSidebar ? 'none' : 'rotate(180deg)', transition:'transform 0.3s ease' }} />
              </button>

              {/* — RIGHT SIDEBAR — */}
              <div style={{ width: (showRightSidebar && !gridFullscreen) ? 262 : 0, flexShrink: 0, overflow: 'hidden', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
                <div className="hidden lg:flex flex-col h-full overflow-y-auto custom-scroll gap-2 p-2.5" style={{ width: 262, background:'var(--bg-surface)', borderLeft:'1px solid var(--border-faint)' }}>
                
                {/* Round & Current Actor + Combat Controls */}
                <div className="sidebar-panel" style={{ background: combat.isActive ? 'rgba(201,152,58,0.08)' : 'var(--bg-raised)', border:`1px solid ${combat.isActive ? 'rgba(201,152,58,0.28)' : 'var(--border-faint)'}`, textAlign:'center' }}>
                  {combat.isActive ? (
                    <>
                      <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.25em', color:'var(--text-muted)', marginBottom:3 }}>Rodada</p>
                      <p key={`round-${combat.round}`} style={{ fontSize:40, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:'var(--gold-bright)', lineHeight:1, animation:'roundBounceIn 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}>{combat.round}</p>
                      {currentActor && (
                        <div key={`actor-${currentActor.combatId}-${turnChangeKey}`} style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(201,152,58,0.15)', animation:'turnActorSlide 0.4s ease both' }}>
                          <p style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:5 }}>Vez de</p>
                          <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                            <div style={{ width:28, height:28, borderRadius:8, overflow:'hidden', border:'2px solid rgba(201,152,58,0.5)', flexShrink:0 }}>
                              <img src={currentActor.icon||null} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            </div>
                            <span style={{ fontSize:13, fontWeight:700, color:'var(--gold-pale)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:150 }}>{currentActor.name}</span>
                          </div>
                        </div>
                      )}
                      {/* Turn action buttons */}
                      <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(201,152,58,0.15)', display:'flex', flexDirection:'column', gap:6 }}>
                        {turnTimerEnabled && (
                          <div style={{ textAlign:'center', padding:'4px 10px', background: turnTimerRemaining <= 10 ? 'rgba(239,68,68,0.15)' : 'rgba(201,152,58,0.1)', border:`1px solid ${turnTimerRemaining<=10?'rgba(239,68,68,0.35)':'rgba(201,152,58,0.25)'}`, borderRadius:7, display:'flex', alignItems:'center', gap:5, justifyContent:'center' }} className={turnTimerRemaining <= 10 && turnTimerRunning ? 'timer-urgent' : ''}>
                            <Hourglass style={{ width:10, height:10, color: turnTimerRemaining <= 10 ? '#f87171' : 'var(--gold-mid)' }} />
                            <span style={{ fontSize:14, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: turnTimerRemaining <= 10 ? '#f87171' : 'var(--gold-bright)' }}>
                              {String(Math.floor(turnTimerRemaining/60)).padStart(2,'0')}:{String(turnTimerRemaining%60).padStart(2,'0')}
                            </span>
                          </div>
                        )}
                        <button onClick={endTurnWithTimer} style={{ padding:'5px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'var(--text-muted)', fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', display:'flex', alignItems:'center', justifyContent:'center', gap:5, whiteSpace:'nowrap' }} className="hover:text-white hover:border-slate-500 hover:bg-white/5 transition-all">
                          <Clock style={{width:11,height:11}}/> Aguardar
                        </button>
                        <button onClick={endTurnWithTimer} style={{ padding:'8px 12px', background:'linear-gradient(135deg,#c9983a 0%,#f0c060 50%,#c9983a 100%)', border:'none', borderRadius:8, color:'#0f1117', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', display:'flex', alignItems:'center', justifyContent:'center', gap:5, boxShadow:'0 0 16px rgba(201,152,58,0.45), inset 0 1px 0 rgba(255,255,255,0.3)', whiteSpace:'nowrap' }} className="hover:brightness-110 active:scale-95 transition-all">
                          Próximo <ChevronRight style={{width:12,height:12}}/>
                        </button>
                      </div>
                      {/* Management buttons */}
                      <div style={{ marginTop:8, display:'flex', gap:5 }}>
                        <button onClick={() => setShowAddCombatantModal(true)} style={{ flex:1, background: 'rgba(201,152,58,0.12)', border: '1px solid rgba(201,152,58,0.25)', borderRadius: 8, padding: '6px 8px', color: '#e8c878', display: 'flex', alignItems: 'center', justifyContent:'center', gap: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }} className="hover:bg-amber-600/25 transition-all">
                          <UserPlus className="w-3.5 h-3.5" /> Adicionar
                        </button>
                        <button onClick={() => setShowHistoryModal(true)} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-faint)', borderRadius: 7, padding: '6px 8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:text-amber-400 hover:border-amber-700/50 transition-all" title="Histórico de combate">
                          <ScrollText className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={endCombat} style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 7, padding: '6px 8px', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:bg-rose-600/20 transition-all" title="Encerrar combate">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize:11, color:'var(--text-faint)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:12 }}>Aguardando início</p>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={() => setShowAddCombatantModal(true)} style={{ flex:1, background: 'rgba(201,152,58,0.12)', border: '1px solid rgba(201,152,58,0.25)', borderRadius: 8, padding: '6px 8px', color: '#e8c878', display: 'flex', alignItems: 'center', justifyContent:'center', gap: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }} className="hover:bg-amber-600/25 transition-all">
                          <UserPlus className="w-3.5 h-3.5" /> Adicionar
                        </button>
                        <button onClick={() => setShowHistoryModal(true)} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-faint)', borderRadius: 7, padding: '6px 8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:text-amber-400 hover:border-amber-700/50 transition-all" title="Histórico">
                          <ScrollText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Turn Timer */}
                <div className="sidebar-panel">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: turnTimerEnabled ? 10 : 0 }}>
                    <p className="sidebar-section-title" style={{ marginBottom:0 }}><Hourglass className="w-3 h-3 text-amber-400"/>Cronômetro</p>
                    <button onClick={() => { setTurnTimerEnabled(v=>!v); setTurnTimerRunning(false); setTurnTimerRemaining(turnTimerSeconds); }}
                      style={{ fontSize:9, fontWeight:700, padding:'2px 9px', borderRadius:6, background: turnTimerEnabled ? 'rgba(201,152,58,0.15)' : 'var(--bg-raised)', border:'1px solid var(--border-faint)', color: turnTimerEnabled ? 'var(--gold-mid)' : 'var(--text-muted)' }}>
                      {turnTimerEnabled ? '● On' : '○ Off'}
                    </button>
                  </div>
                  {turnTimerEnabled && (
                    <div>
                      <div style={{ textAlign:'center', padding:'12px', background: turnTimerRemaining <= 10 ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.25)', border:`1px solid ${turnTimerRemaining<=10 ? 'rgba(239,68,68,0.3)' : 'var(--border-faint)'}`, borderRadius:10, marginBottom:8 }}
                        className={turnTimerRemaining <= 10 && turnTimerRunning ? 'timer-urgent' : ''}>
                        <p style={{ fontSize:36, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: turnTimerRemaining <= 10 ? '#f87171' : 'var(--text-primary)', lineHeight:1 }}>
                          {String(Math.floor(turnTimerRemaining/60)).padStart(2,'0')}:{String(turnTimerRemaining%60).padStart(2,'0')}
                        </p>
                      </div>
                      <div style={{ display:'flex', gap:5, marginBottom:8 }}>
                        <button onClick={() => { setTurnTimerRunning(v=>!v); }}
                          style={{ flex:2, padding:'7px', borderRadius:8, fontSize:11, fontWeight:700, background: turnTimerRunning ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', border:`1px solid ${turnTimerRunning?'rgba(239,68,68,0.35)':'rgba(34,197,94,0.35)'}`, color: turnTimerRunning ? '#f87171' : '#86efac', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                          {turnTimerRunning ? <><Pause style={{width:11,height:11}}/> Pausar</> : <><Play style={{width:11,height:11}}/> Iniciar</>}
                        </button>
                        <button onClick={() => { setTurnTimerRemaining(turnTimerSeconds); setTurnTimerRunning(false); }}
                          style={{ flex:1, padding:'7px', borderRadius:8, fontSize:11, fontWeight:700, background:'var(--bg-raised)', border:'1px solid var(--border-faint)', color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <RefreshCw style={{width:11,height:11}}/>
                        </button>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:10, color:'var(--text-muted)', flexShrink:0 }}>Limite:</span>
                        <input type="number" value={turnTimerSeconds} min={5} max={600} onChange={e => { const v = parseInt(e.target.value); if(!isNaN(v)&&v>0){setTurnTimerSeconds(v); setTurnTimerRemaining(v); setTurnTimerRunning(false); }}}
                          style={{ flex:1, background:'rgba(0,0,0,0.35)', border:'1px solid var(--border-faint)', borderRadius:7, padding:'5px 8px', fontSize:12, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'var(--text-primary)', outline:'none', textAlign:'center' }} />
                        <span style={{ fontSize:10, color:'var(--text-muted)', flexShrink:0 }}>seg</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Field Conditions */}
                <div className="sidebar-panel">
                  <p className="sidebar-section-title"><Zap className="w-3 h-3 text-yellow-400"/>Condições de Campo</p>
                  <FieldConditionCreator onAdd={(name, duration) => {
                    updateCombat({...combat, fieldConditions: [...combat.fieldConditions, {id: Math.random().toString(36).substr(2,9), name, duration, sourceCard: 'Manual'}]});
                  }} />
                  <div className="space-y-2 mt-2.5">
                    {combat.fieldConditions.map(f=>(
                      <div key={f.id} style={{ background:'rgba(201,152,58,0.08)', border:'1px solid rgba(201,152,58,0.2)', borderRadius:9, padding:'8px 10px' }}>
                        <div className="flex justify-between items-center mb-2">
                          <p style={{ fontSize:12, fontWeight:700, color:'var(--gold-pale)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, marginRight:6 }}>{f.name}</p>
                          <button onClick={()=>removeFieldCondition(f.id)} style={{ color:'var(--text-faint)', flexShrink:0 }} className="hover:text-rose-400 transition-colors"><Trash2 style={{width:12,height:12}}/></button>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:0, background:'rgba(0,0,0,0.3)', borderRadius:7, padding:'2px 5px', width:'fit-content' }}>
                          <button onClick={()=>updateFieldCondition(f.id,f.duration-1)} style={{ fontSize:16, fontWeight:700, color:'var(--text-muted)', padding:'0 8px', lineHeight:1 }} className="hover:text-white transition-colors">−</button>
                          <span style={{ fontSize:16, fontWeight:700, color:'var(--gold-mid)', minWidth:24, textAlign:'center', fontFamily:"'JetBrains Mono',monospace" }}>{f.duration}</span>
                          <button onClick={()=>updateFieldCondition(f.id,f.duration+1)} style={{ fontSize:16, fontWeight:700, color:'var(--text-muted)', padding:'0 8px', lineHeight:1 }} className="hover:text-white transition-colors">+</button>
                        </div>
                      </div>
                    ))}
                    {combat.fieldConditions.length===0 && <p style={{ fontSize:11, color:'var(--text-faint)', textAlign:'center', padding:'6px 0' }}>Nenhuma condição ativa</p>}
                  </div>
                </div>

                {/* Custom Pins */}
                <div className="sidebar-panel">
                  <p className="sidebar-section-title"><MapPin className="w-3 h-3 text-amber-400"/>Pins do Grid</p>
                  <CustomPinCreator
                    onPlace={(label, color) => setPlacingPin({ label, color })}
                    isPlacing={!!placingPin}
                    onCancel={() => setPlacingPin(null)}
                    pins={combat.customPins || []}
                    onRemove={(id) => updateCombat({...combat, customPins: (combat.customPins||[]).filter(p => p.id !== id)})}
                  />
                </div>

                </div>
              </div>

              {/* ══ BARRA DE AÇÕES INFERIOR — OVERLAY FLUTUANTE ══════════════ */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 0,
              pointerEvents: 'none',
              zIndex: 20,
              overflow: 'visible',
              transform: 'scale(1)',
              transformOrigin: 'bottom center',
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            }}>

              {/* ── COLUNA ESQUERDA — Seletor de Comando ── */}
              <div style={{
                width: 210, flexShrink: 0,
                padding: '10px 12px 14px 14px',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8,
                pointerEvents: 'auto', position: 'relative', zIndex: 5,
              }}>
                {/* COMMAND SELECTOR — moved to left */}
                {(currentActor || selectedCombatantId) && !selectingTargetFor && (() => {
                  // Pre-compute card counts per command for the active actor
                  const cmdActor = combat.combatants.find(c => c.combatId === (selectedCombatantId || currentActor?.combatId));
                  const cmdCardCounts: Record<string, number> = { ataque: 0, 'vínculo': 0, item: 0, foco: 0, 'fusão': 0 };
                  if (cmdActor) {
                    const activeForms = combat?.activeForms || [];
                    const myForma = activeForms.find(f => f.combatantId === cmdActor.combatId);
                    const allCharCards = [
                      ...(cmdActor.cardIds || []).map(id => cards.find(c => c.id === id)).filter(Boolean),
                      ...(myForma ? myForma.extraCardIds.map(id => cards.find(c => c.id === id)).filter(Boolean) : []),
                    ] as any[];
                    allCharCards.forEach((c: any) => {
                      if (c.command && cmdCardCounts.hasOwnProperty(c.command)) {
                        cmdCardCounts[c.command]++;
                      } else if (!c.command) {
                        // cards without command appear in all
                        ['ataque', 'vínculo', 'foco'].forEach(k => cmdCardCounts[k]++);
                      }
                    });
                    // Count combat-usable items
                    const combatItems = (cmdActor.items || []).filter((it: any) => it.usableInCombat && (it.quantity ?? 1) > 0);
                    cmdCardCounts['item'] = combatItems.length;
                    // Fusão is available when actor has 2+ cards
                    cmdCardCounts['fusão'] = allCharCards.length >= 2 ? allCharCards.length : 0;
                    // Selo is always available (uses code input)
                    cmdCardCounts['selo'] = 1;
                  }
                  return (
                  <div style={{
                    width: '100%',
                    background: '#000',
                    border: '2px solid #a0a8c0',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}>
                    {/* COMANDO title bar */}
                    <div style={{
                      background: 'linear-gradient(90deg, #0a1a6e 0%, #1a3aae 50%, #0a1a6e 100%)',
                      padding: '5px 10px',
                      textAlign: 'center',
                      letterSpacing: '0.3em',
                      fontSize: 11,
                      fontWeight: 900,
                      color: '#c8d8ff',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #3050b0',
                    }}>
                      ✦ COMANDO ✦
                    </div>
                    {/* Command buttons */}
                    {([
                      { id: 'ataque' as CommandType, label: 'Ataque', icon: ATTACK_ICON_B64 },
                      { id: 'vínculo' as CommandType, label: 'Vínculo', icon: VINCULO_ICON_B64 },
                      { id: 'item' as CommandType, label: 'Itens', icon: ITEMS_ICON_B64 },
                      { id: 'foco' as CommandType, label: 'Foco', icon: FOCO_ICON_B64 },
                      { id: 'fusão' as CommandType, label: 'Fusão', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYzRiNWZkIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyeiIvPjxwYXRoIGQ9Ik04IDEybDQtNCA0IDQiLz48cGF0aCBkPSJNOCAxNmw0LTQgNCA0Ii8+PC9zdmc+' },
                      { id: 'selo' as CommandType, label: 'Selos', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+PHBvbHlnb24gcG9pbnRzPSIxMiwyIDIyLDguNSAyMiwxNS41IDEyLDIyIDIsMTUuNSAyLDguNSIgc3Ryb2tlPSIjZmI5MjNjIiBzdHJva2Utd2lkdGg9IjEuNSIgZmlsbD0icmdiYSgyMzQsODgsMTIsMC4xNSkiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIiBmaWxsPSIjZmI5MjNjIiBvcGFjaXR5PSIwLjgiLz48cGF0aCBkPSJNMTIgNnY2bTAgMHY2TTYgMTJoNm02IDB2NiIgc3Ryb2tlPSIjZmI5MjNjIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+' },
                    ]).map(cmd => {
                      const isActive = activeCommand === cmd.id;
                      const hasCards = cmdCardCounts[cmd.id] > 0;
                      const isDisabled = !hasCards;
                      return (
                        <div
                          key={cmd.id}
                          onClick={() => {
                            if (isDisabled) return;
                            if (activeCommand === cmd.id) {
                              const next = !commandShowAll;
                              setCommandShowAll(next);
                              if (!next) setCommandShowAllSearch('');
                            } else {
                              setActiveCommand(cmd.id);
                              setCommandShowAll(false);
                              setCommandShowAllSearch('');
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '7px 12px',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            background: isActive
                              ? 'linear-gradient(90deg, #0a1a6e 0%, #1a3aae 50%, #0a1a6e 100%)'
                              : 'transparent',
                            borderBottom: '1px solid rgba(160,168,192,0.18)',
                            transition: 'background 0.2s',
                            opacity: isDisabled ? 0.35 : 1,
                          }}
                          className={isDisabled ? '' : 'hover:brightness-125'}
                        >
                          <img src={cmd.icon} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0, filter: isDisabled ? 'grayscale(1) brightness(0.5)' : isActive ? 'brightness(1.3) drop-shadow(0 0 4px rgba(160,200,255,0.8))' : 'brightness(0.85)' }} />
                          <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: isDisabled ? 'rgba(120,128,150,0.5)' : isActive ? '#fff' : 'rgba(160,168,200,0.7)',
                            textShadow: isActive && !isDisabled ? '0 0 10px rgba(100,160,255,0.8)' : 'none',
                          }}>{cmd.label}</span>
                          {isActive && commandShowAll && (
                            <span style={{ marginLeft: 'auto', fontSize: 8, color: 'rgba(160,200,255,0.6)', fontWeight: 700, letterSpacing: '0.1em' }}>TUDO</span>
                          )}
                          {isDisabled && (
                            <span style={{ marginLeft: 'auto', fontSize: 7, color: 'rgba(120,128,150,0.45)', fontWeight: 700, letterSpacing: '0.08em' }}>—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  );
                })()}
                {/* No one selected */}
                {!currentActor && !selectedCombatantId && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,0.15)', fontWeight:700, fontSize:9, textTransform:'uppercase', letterSpacing:'0.2em', fontStyle:'italic', paddingBottom:8, paddingLeft:4 }}>
                    <MousePointer2 style={{ width:12, height:12 }} /> Selecione
                  </div>
                )}
              </div>

              {/* ── COLUNA CENTRAL — Cartas ── */}
              <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', alignItems:'center', pointerEvents:'auto', position:'relative', zIndex:5, overflow:'visible' }}>


                {/* Card Hand Arc */}
                <div style={{ padding:'0 16px 10px', width:'100%', display:'flex', alignItems:'flex-end', position:'relative', overflow:'visible' }}>
                  {selectingTargetFor ? (
                    <div style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center' }} className="anim-scale-in">
                      <div style={{ textAlign:'center' }}>
                        {selectingTargetFor.isAreaEffect ? (
                          // Area multi-select mode
                          <>
                            <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(234,88,12,0.12)', border:'1px solid rgba(234,88,12,0.5)', borderRadius:12, padding:'8px 20px', marginBottom:10 }}>
                              <span style={{ fontSize:16 }}>💥</span>
                              <span style={{ fontSize:11, fontWeight:700, color:'#fb923c', textTransform:'uppercase', letterSpacing:'0.3em' }}>Efeito em Área</span>
                              <span style={{ fontSize:9, color:'rgba(251,146,60,0.6)', letterSpacing:'0.1em' }}>— {selectingTargetFor.name}</span>
                            </div>
                            <p style={{ fontSize:9, color:'rgba(212,168,83,0.6)', textTransform:'uppercase', letterSpacing:'0.3em', marginBottom:10 }}>Clique nos alvos no grid ou na faixa de turnos para selecionar</p>
                            {areaSelectedTargets.length > 0 && (
                              <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', marginBottom:10 }}>
                                {areaSelectedTargets.map(tid => {
                                  const t = combat.combatants.find(c => c.combatId === tid);
                                  return t ? (
                                    <div key={tid} style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(234,88,12,0.2)', border:'1px solid rgba(234,88,12,0.5)', borderRadius:6, padding:'3px 8px' }}>
                                      {t.icon && <img src={t.icon} style={{ width:14, height:14, borderRadius:3, objectFit:'cover' }}/>}
                                      <span style={{ fontSize:9, color:'#fb923c', fontWeight:700 }}>{t.name}</span>
                                      <button onClick={() => setAreaSelectedTargets(prev => prev.filter(id => id !== tid))} style={{ color:'rgba(251,146,60,0.5)', fontSize:10, background:'none', border:'none', cursor:'pointer', padding:0, lineHeight:1 }}>✕</button>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            )}
                            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                              <button onClick={() => executeCardOnTarget(selectingTargetFor, 'area', undefined, areaSelectedTargets.length > 0 ? areaSelectedTargets : undefined)}
                                style={{ background:'linear-gradient(135deg,rgba(234,88,12,0.5),rgba(180,60,5,0.7))', border:'1px solid rgba(234,88,12,0.6)', borderRadius:12, padding:'10px 22px', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'#fed7aa', boxShadow:'0 0 20px rgba(234,88,12,0.3)', display:'flex', alignItems:'center', gap:7 }}
                                className="hover:brightness-110 active:scale-95">
                                💥 {areaSelectedTargets.length > 0 ? `Executar (${areaSelectedTargets.length} alvos)` : 'Executar em Todos'}
                              </button>
                              <button onClick={() => executeCardOnTarget(selectingTargetFor, 'self')}
                                style={{ background:'rgba(24,28,40,0.95)', border:'1px solid rgba(212,168,83,0.3)', borderRadius:12, padding:'10px 18px', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'#d4a853', display:'flex', alignItems:'center', gap:7 }}
                                className="hover:brightness-110 active:scale-95">
                                ⊕ Auto
                              </button>
                              <button onClick={() => { setSelectingTargetFor(null); setAreaSelectedTargets([]); }}
                                style={{ background:'rgba(30,12,12,0.9)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:12, padding:'10px 18px', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'#f87171', display:'flex', alignItems:'center', gap:7 }}
                                className="hover:brightness-110 active:scale-95">
                                ✕ Cancelar
                              </button>
                            </div>
                          </>
                        ) : (
                          // Single target mode
                          <>
                            <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.4)', borderRadius:12, padding:'8px 20px', marginBottom:14 }}>
                              <Target style={{ width:14, height:14, color:'#f87171' }} />
                              <span style={{ fontSize:11, fontWeight:700, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.3em' }}>Selecionar Alvo</span>
                              <span style={{ fontSize:9, color:'rgba(248,113,113,0.6)', letterSpacing:'0.1em' }}>— {selectingTargetFor.name}</span>
                            </div>
                            <p style={{ fontSize:9, color:'rgba(212,168,83,0.6)', textTransform:'uppercase', letterSpacing:'0.3em', marginBottom:16 }}>Clique num combatente na grade, na faixa de turnos, ou escolha abaixo</p>
                            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                              {[
                                {label:'Auto-Alvo',icon:'⊕',action:()=>executeCardOnTarget(selectingTargetFor,'self'),bg:'rgba(24,28,40,0.95)',border:'rgba(212,168,83,0.3)',color:'#d4a853',glow:'0 0 16px rgba(212,168,83,0.2)'},
                                {label:'Área Total',icon:'◈',action:()=>executeCardOnTarget(selectingTargetFor,'area'),bg:'linear-gradient(135deg,rgba(180,140,40,0.3),rgba(120,90,20,0.5))',border:'rgba(212,168,83,0.6)',color:'#fdf0cc',glow:'0 0 24px rgba(212,168,83,0.35)'},
                                {label:'Cancelar',icon:'✕',action:()=>setSelectingTargetFor(null),bg:'rgba(30,12,12,0.9)',border:'rgba(220,38,38,0.3)',color:'#f87171',glow:'none'},
                              ].map(b=>(
                                <button key={b.label} onClick={b.action} style={{ background:b.bg, border:`1px solid ${b.border}`, borderRadius:14, padding:'14px 28px', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.15em', color:b.color, boxShadow:b.glow, display:'flex', alignItems:'center', gap:8, transition:'all 0.2s' }} className="hover:brightness-110 active:scale-95">
                                  <span style={{fontSize:14}}>{b.icon}</span>{b.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : itemTargetPickerItem ? (
                    /* ── ITEM TARGET PICKER ── */
                    <div style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center' }} className="anim-scale-in">
                      <div style={{ textAlign:'center' }}>
                        <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(5,40,20,0.85)', border:'1px solid rgba(74,222,128,0.5)', borderRadius:12, padding:'8px 20px', marginBottom:14 }}>
                          {itemTargetPickerItem.item.image
                            ? <img src={itemTargetPickerItem.item.image} style={{ width:22, height:22, borderRadius:5, objectFit:'cover' }} />
                            : <span style={{ fontSize:16 }}>🧪</span>}
                          <span style={{ fontSize:11, fontWeight:700, color:'#86efac', textTransform:'uppercase', letterSpacing:'0.3em' }}>Usar Item</span>
                          <span style={{ fontSize:9, color:'rgba(134,239,172,0.6)', letterSpacing:'0.1em' }}>— {itemTargetPickerItem.item.name}</span>
                        </div>
                        <p style={{ fontSize:9, color:'rgba(134,239,172,0.6)', textTransform:'uppercase', letterSpacing:'0.3em', marginBottom:16 }}>Clique num combatente na grade ou escolha abaixo</p>
                        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
                          {combat.combatants.filter(c => c.combatId !== itemTargetPickerItem.actor.combatId).map(tc => (
                            <button key={tc.combatId} onClick={() => {
                              setItemTargetPickerItem(null);
                              handleUseItem(itemTargetPickerItem.actor, itemTargetPickerItem.item, tc.combatId);
                            }}
                              style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(5,40,20,0.85)', border:'1px solid rgba(74,222,128,0.4)', borderRadius:12, padding:'10px 18px', fontWeight:700, fontSize:11, color:'#86efac', cursor:'pointer' }}
                              className="hover:brightness-110 active:scale-95">
                              {tc.icon && <img src={tc.icon} style={{ width:20, height:20, borderRadius:5, objectFit:'cover' }} />}
                              {tc.name}
                            </button>
                          ))}
                          <button onClick={() => setItemTargetPickerItem(null)}
                            style={{ background:'rgba(30,12,12,0.9)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:12, padding:'10px 18px', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'#f87171', display:'flex', alignItems:'center', gap:7 }}
                            className="hover:brightness-110 active:scale-95">
                            ✕ Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ position:'relative', height:195, width:'100%', display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:4, overflow:'visible' }}>
                      {(()=>{
                        const actor = combat.combatants.find(c=>c.combatId===(selectedCombatantId||currentActor?.combatId));
                        if (!actor) return (
                          <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, opacity:0.15, height:150 }}>
                            <Layers style={{width:32,height:32,color:'#475569'}} />
                            <p style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.3em'}}>Selecione um combatente para ver suas habilidades</p>
                          </div>
                        );

                        const typeConfig: Record<string,{bg:string,border:string,glow:string,label:string,topColor:string,headerBg:string,nameShadow:string}> = {
                          'ataque': {bg:'linear-gradient(165deg,rgba(45,15,15,0.97) 0%,rgba(55,18,18,0.95) 100%)',border:'rgba(239,68,68,0.7)',glow:'rgba(239,68,68,0.85)',label:'ATK',topColor:'#ef4444',headerBg:'rgba(239,68,68,0.15)',nameShadow:'0 0 20px rgba(239,68,68,0.7)'},
                          'ação':   {bg:'linear-gradient(165deg,rgba(40,30,5,0.97) 0%,rgba(60,45,5,0.95) 100%)',border:'rgba(234,179,8,0.7)',glow:'rgba(234,179,8,0.85)',label:'AÇÃ',topColor:'#eab308',headerBg:'rgba(234,179,8,0.15)',nameShadow:'0 0 20px rgba(234,179,8,0.7)'},
                          'reação': {bg:'linear-gradient(165deg,rgba(5,15,40,0.97) 0%,rgba(8,22,55,0.95) 100%)',border:'rgba(59,130,246,0.7)',glow:'rgba(59,130,246,0.85)',label:'REA',topColor:'#3b82f6',headerBg:'rgba(59,130,246,0.15)',nameShadow:'0 0 20px rgba(59,130,246,0.7)'},
                          'reforço':{bg:'linear-gradient(165deg,rgba(5,30,12,0.97) 0%,rgba(8,45,18,0.95) 100%)',border:'rgba(34,197,94,0.7)',glow:'rgba(34,197,94,0.85)',label:'REF',topColor:'#22c55e',headerBg:'rgba(34,197,94,0.15)',nameShadow:'0 0 20px rgba(34,197,94,0.7)'},
                          'vínculo':{bg:'linear-gradient(165deg,rgba(20,22,28,0.97) 0%,rgba(30,32,40,0.95) 100%)',border:'rgba(148,163,184,0.7)',glow:'rgba(148,163,184,0.85)',label:'VÍN',topColor:'#94a3b8',headerBg:'rgba(148,163,184,0.15)',nameShadow:'0 0 20px rgba(148,163,184,0.7)'},
                          'combinação':{bg:'linear-gradient(165deg,rgba(40,5,60,0.97) 0%,rgba(55,8,80,0.95) 100%)',border:'rgba(168,85,247,0.9)',glow:'rgba(168,85,247,1)',label:'CMB',topColor:'#c084fc',headerBg:'rgba(192,132,252,0.18)',nameShadow:'0 0 20px rgba(192,132,252,0.9)'},
                          'forma':  {bg:'linear-gradient(165deg,rgba(40,25,0,0.97) 0%,rgba(60,38,0,0.95) 100%)',border:'rgba(245,158,11,0.8)',glow:'rgba(245,158,11,0.9)',label:'FRM',topColor:'#f59e0b',headerBg:'rgba(245,158,11,0.15)',nameShadow:'0 0 20px rgba(245,158,11,0.8)'},
                        };

                        const allActorCards = ['ataque','ação','reação','reforço','vínculo','combinação','forma'].flatMap(type =>{
                          const baseCards = (actor.cardIds||[])
                            .map(id => cards.find(c=>c.id===id))
                            .filter(c => c && c.type===type) as any[];
                          // Add forma extra cards for active formas
                          if (type !== 'forma') {
                            const activeForms = combat?.activeForms || [];
                            const myForma = activeForms.find(f => f.combatantId === actor.combatId);
                            if (myForma && myForma.extraCardIds.length > 0) {
                              const extraCards = myForma.extraCardIds
                                .map(id => cards.find(c=>c.id===id))
                                .filter(c => c && c.type===type) as any[];
                              return [...baseCards, ...extraCards];
                            }
                          }
                          return baseCards;
                        });

                        // Pinned cards aparecem primeiro, depois o restante
                        const pinnedIds = actor.pinnedCardIds || [];
                        const pinnedCards = pinnedIds.map(id => allActorCards.find((c:any) => c.id === id)).filter(Boolean) as any[];
                        const unpinnedCards = allActorCards.filter((c:any) => !pinnedIds.includes(c.id));
                        const sortedActorCards = [...pinnedCards, ...unpinnedCards];

                        const allCards = sortedActorCards.filter((c:any) => c.name.toLowerCase().includes(combatCardFilter.toLowerCase()));

                        // If no command is selected, show empty hand
                        if (!activeCommand) return (
                          <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, opacity:0.2, height:150 }}>
                            <Layers style={{width:32,height:32,color:'#475569'}} />
                            <p style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.3em'}}>Selecione um comando →</p>
                          </div>
                        );

                        // ── ITEM COMMAND: render item panel instead of card hand ──
                        if (activeCommand === 'item') {
                          return <CombatItemPanel actor={actor} onUseItem={(item) => handleUseItem(actor, item)} />;
                        }

                        // ── FUSÃO COMMAND ──
                        if (activeCommand === 'fusão') {
                          return <CardFusionPanel actor={actor} allCards={allCards} onStartFusion={(selectedCards) => {
                            setFusionSelectedCards(selectedCards);
                            setFusionActor(actor);
                            setFusionStep('rolling');
                            setActiveCommand(null);
                          }} onCancel={() => setActiveCommand(null)} />;
                        }

                        // ── SELO COMMAND ──
                        if (activeCommand === 'selo') {
                          return (
                            <SealCommandPanel
                              actor={actor}
                              seals={seals}
                              characters={characters}
                              onExecuteSeal={(seal) => {
                                // Check requirements
                                const reqs = seal.requirements || [];
                                for (const req of reqs) {
                                  if (req.type === 'specificCharacter' && actor.id !== req.characterId) {
                                    const needed = characters.find(c => c.id === req.characterId);
                                    alert(`Apenas ${needed?.name ?? 'personagem específico'} pode usar este selo.`);
                                    return;
                                  }
                                  if (req.type === 'linkedCard') {
                                    const hasCard = (actor.cardIds || []).includes(req.cardId || '');
                                    if (!hasCard) {
                                      const needed = seals.find(s => s.id === seal.id); // reuse
                                      alert(`Você precisa ter a carta requisitada para usar este selo.`);
                                      return;
                                    }
                                  }
                                  if (req.type === 'itemCount') {
                                    const inv = actor.items || [];
                                    const item = inv.find((it: any) => it.name?.toLowerCase() === (req.itemName || '').toLowerCase());
                                    if (!item || (item.quantity ?? 1) < (req.itemQuantity ?? 1)) {
                                      alert(`Você precisa de ${req.itemQuantity ?? 1}x "${req.itemName}" para usar este selo.`);
                                      return;
                                    }
                                  }
                                  if (req.type === 'minHp') {
                                    const pct = actor.maxHp > 0 ? (actor.currentHp / actor.maxHp) * 100 : 0;
                                    if (pct < (req.value ?? 50)) { alert(`Seu HP precisa estar acima de ${req.value ?? 50}% para usar este selo.`); return; }
                                  }
                                  if (req.type === 'minAura') {
                                    const pct = actor.maxAura > 0 ? (actor.currentAura / actor.maxAura) * 100 : 0;
                                    if (pct < (req.value ?? 50)) { alert(`Sua Aura precisa estar acima de ${req.value ?? 50}% para usar este selo.`); return; }
                                  }
                                  if (req.type === 'hasVinculo') {
                                    const actorChar = characters.find(c => c.id === actor.id);
                                    const actorBonds = actorChar?.bonds || [];
                                    const hasB = actorBonds.some(b => b.toLowerCase().trim() === (req.vinculoName || '').toLowerCase().trim());
                                    if (!hasB) {
                                      alert(`Requisito não atendido: o personagem precisa ter o vínculo "${req.vinculoName}" para usar este selo.`);
                                      return;
                                    }
                                  }
                                }
                                // Check mode
                                if (seal.executionMode === 'preparation' && (seal.preparationRounds ?? 0) > 0) {
                                  setActiveSealPrep({ sealId: seal.id, actorCombatId: actor.combatId, roundsLeft: seal.preparationRounds! });
                                  setActiveCommand(null);
                                  alert(`\${actor.name} começa a preparar o Selo "\${seal.name}". Faltam \${seal.preparationRounds} rodada(s)!`);
                                  return;
                                }
                                if (seal.executionMode === 'combo') {
                                  setSealComboSelectModal({ seal, actor });
                                  setActiveCommand(null);
                                  return;
                                }
                                // Immediate execution
                                executeSeal(seal, actor.combatId, [actor.combatId]);
                                setActiveCommand(null);
                              }}
                              onCancel={() => setActiveCommand(null)}
                            />
                          );
                        }

                        // Filter by command: cards with matching command, or cards with no command (show in all)
                        const commandCardsBase = allCards.filter((c:any) => !c.command || c.command === activeCommand);

                        // When showing all, also filter by the search bar
                        const commandCards = commandShowAll && commandShowAllSearch
                          ? commandCardsBase.filter((c:any) => c.name.toLowerCase().includes(commandShowAllSearch.toLowerCase()))
                          : commandCardsBase;

                        if (commandCardsBase.length===0) return (
                          <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, opacity:0.2, height:150 }}>
                            <Layers style={{width:32,height:32,color:'#475569'}} />
                            <p style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.3em'}}>Sem cartas neste comando</p>
                          </div>
                        );

                        // Limit to 7 visible cards; always include pinned cards; show all if commandShowAll is true
                        const MAX_VISIBLE = 7;
                        // Always show pinned cards + fill remaining slots with unpinned
                        const pinnedInCommand = commandCards.filter((c:any) => (actor.pinnedCardIds || []).includes(c.id));
                        const unpinnedInCommand = commandCards.filter((c:any) => !(actor.pinnedCardIds || []).includes(c.id));
                        const visibleCards = commandShowAll
                          ? commandCards
                          : [
                              ...pinnedInCommand,
                              ...unpinnedInCommand.slice(0, Math.max(0, MAX_VISIBLE - pinnedInCommand.length)),
                            ];
                        const hasMoreCards = !commandShowAll && commandCardsBase.length > MAX_VISIBLE;

                        // ── NPC SPECIAL CARDS: inject wildcard + fixed cards ──
                        const isNpcActor = actor.role === 'npc';
                        const NPC_CONTRA_ATAQUE_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMWExMDE4Ii8+PHBhdGggZD0iTTQwIDEwIEw2NiA2MCBIMTRIWTQ4IDMyIFo0MCAxMFoiIGZpbGw9InJnYmEoMjM5LDY4LDY4LDAuMTUpIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC42Ii8+PHBhdGggZD0iTTM0IDM4IEw0NiAzOCBNNDAgMzIgTDQwIDQ0IiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMjYgNTIgTDM0IDQ0IE0zNCA1MiBMMjYgNDQiIHN0cm9rZT0iI2VmNDQ0NCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIG9wYWNpdHk9IjAuNiIvPjx0ZXh0IHg9IjQwIiB5PSI3MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC13ZWlnaHQ9IjkwMCIgZm9udC1zaXplPSI3IiBmaWxsPSIjZWY0NDQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBvcGFjaXR5PSIwLjciPkNPTlRSQS1BVEFRVUUmbHQ7L3RleHQ+PC9zdmc+";
                        const NPC_ARMADURA_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMGMxYTBjIi8+PHBhdGggZD0iTTQwIDEyIEw2MiAyMiBMNjIgNDggUTYyIDYyIDQwIDY4IFExOCA2MiAxOCA0OCBMMTQ4IDIyIFoiIGZpbGw9InJnYmEoMzQsMTk3LDk0LDAuMTIpIiBzdHJva2U9IiMyMmM1NWUiIHN0cm9rZS13aWR0aD0iMS41IiBvcGFjaXR5PSIwLjciLz48cGF0aCBkPSJNMzQgNDAgTDM4IDQ0IEw0NiAzNiIgc3Ryb2tlPSIjMjJjNTVlIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+";
                        const NPC_WILDCARD_ATAQUE_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMTgwYTBhIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iNCA0Ii8+PHRleHQgeD0iNDAiIHk9IjM4IiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZWY0NDQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBvcGFjaXR5PSIwLjciPis8L3RleHQ+PHRleHQgeD0iNDAiIHk9IjU4IiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjciIGZpbGw9IiNlZjQ0NDQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuNiI+TlBDIEFUQVFVRTwvdGV4dD48L3N2Zz4=";
                        const NPC_WILDCARD_VINCULO_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMTAxNDE4IiBzdHJva2U9IiM5NGEzYjgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iNCA0Ii8+PHRleHQgeD0iNDAiIHk9IjM4IiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOTRhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBvcGFjaXR5PSIwLjciPis8L3RleHQ+PHRleHQgeD0iNDAiIHk9IjU4IiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjciIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuNiI+TlBDIFbDjU5DVUVMQTQ8L3RleHQ+PC9zdmc+";
                        const NPC_WILDCARD_ITEM_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMGMxODBjIiBzdHJva2U9IiMyMmM1NWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iNCA0Ii8+PHRleHQgeD0iNDAiIHk9IjM4IiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMjJjNTVlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBvcGFjaXR5PSIwLjciPis8L3RleHQ+PHRleHQgeD0iNDAiIHk9IjU4IiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjciIGZpbGw9IiMyMmM1NWUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuNiI+TlBDIElURU08L3RleHQ+PC9zdmc+";

                        // For NPCs, build special card list based on activeCommand
                        let npcSpecialCards: any[] = [];
                        if (isNpcActor && activeCommand && activeCommand !== 'fusão') {
                          // Always include wildcard for ataque, vínculo, item (not forma, not foco, not fusão)
                          const wildcardCommands: Record<string, {label:string, img:string, type:string}> = {
                            'ataque': { label: 'Nova Habilidade', img: NPC_WILDCARD_ATAQUE_IMG, type: 'ataque' },
                            'vínculo': { label: 'Nova Habilidade', img: NPC_WILDCARD_VINCULO_IMG, type: 'vínculo' },
                            'item':    { label: 'Novo Item', img: NPC_WILDCARD_ITEM_IMG, type: 'item' },
                            'foco':    { label: 'Nova Habilidade', img: NPC_WILDCARD_VINCULO_IMG, type: 'ação' },
                          };
                          const wc = wildcardCommands[activeCommand as string];
                          if (wc) {
                            npcSpecialCards.push({
                              __npcSpecial: 'wildcard',
                              __command: activeCommand,
                              id: `__npc_wildcard_${activeCommand}`,
                              name: wc.label,
                              image: wc.img,
                              type: wc.type,
                              auraCost: 0, diceRoll: '1d20', damage: 0, description: 'Criar nova habilidade exclusiva deste NPC',
                            });
                          }
                          // Always include Contra-Ataque (reaction) and Armadura (reforço) as fixed NPC cards
                          // Only show Contra-Ataque in 'ataque'/'vínculo'/'foco' commands, Armadura in all
                          if (activeCommand !== 'item') {
                            npcSpecialCards.push({
                              __npcSpecial: 'contra-ataque',
                              id: '__npc_contra_ataque',
                              name: 'Contra-Ataque',
                              image: NPC_CONTRA_ATAQUE_IMG,
                              type: 'reação',
                              auraCost: 0, diceRoll: '1d20', damage: 5, description: 'Reage ao ataque adversário causando dano de retorno',
                            });
                            npcSpecialCards.push({
                              __npcSpecial: 'armadura',
                              id: '__npc_armadura',
                              name: 'Armadura',
                              image: NPC_ARMADURA_IMG,
                              type: 'reforço',
                              auraCost: 0, diceRoll: '1d20', damage: 0, description: 'Cria uma camada protetora que concede HP extra',
                            });
                          }
                        }

                        // Build display list: visible cards only + NPC special cards at front
                        const displayItems: Array<{type:'card',card:any}> = [
                          ...npcSpecialCards.map(c => ({ type: 'card' as const, card: c })),
                          ...visibleCards.map(c => ({ type: 'card' as const, card: c })),
                        ];

                        const total = displayItems.length;
                        // Fan spread and spacing for proper card hand display
                        const fanSpreadDeg = total <= 1 ? 0 : total <= 3 ? 18 : total <= 5 ? 30 : total <= 7 ? 40 : 44;
                        const CARD_W = 118;
                        const CARD_H = 172;
                        // Step between cards: minimum 60px so 7 cards = 360px total width (visible)
                        const cardStep = total <= 1 ? 0 : total <= 3 ? 110 : total <= 5 ? 90 : 72;

                        // ── SHOW ALL MODE: use a scrollable grid instead of cramped fan ──
                        if (commandShowAll) {
                          const allDisplayItems: Array<{card:any}> = [
                            ...npcSpecialCards.map(c => ({ card: c })),
                            ...commandCards.map(c => ({ card: c })),
                          ];
                          return (
                            <div style={{ width:'100%', display:'flex', flexDirection:'column', animation:'cardDealIn 0.25s ease both' }}>
                              {/* Search bar */}
                              <div style={{ padding:'0 12px 8px', display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ flex:1, display:'flex', alignItems:'center', gap:7, background:'rgba(10,12,20,0.88)', border:'1px solid rgba(160,168,192,0.3)', borderRadius:10, padding:'5px 10px', backdropFilter:'blur(12px)' }}>
                                  <Search style={{ width:11, height:11, color:'rgba(160,200,255,0.5)', flexShrink:0 }} />
                                  <input
                                    type="text"
                                    value={commandShowAllSearch}
                                    onChange={e => setCommandShowAllSearch(e.target.value)}
                                    placeholder="Buscar cartas..."
                                    autoFocus
                                    style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:11, fontWeight:600, color:'#c8d8ff', letterSpacing:'0.04em' }}
                                  />
                                  {commandShowAllSearch && (
                                    <button onClick={() => setCommandShowAllSearch('')} style={{ color:'rgba(160,200,255,0.4)', padding:0, lineHeight:1, flexShrink:0 }}>
                                      <X style={{ width:10, height:10 }} />
                                    </button>
                                  )}
                                </div>
                                <span style={{ fontSize:9, color:'rgba(160,200,255,0.4)', fontWeight:700, letterSpacing:'0.1em', whiteSpace:'nowrap' }}>
                                  {commandCardsBase.length} carta{commandCardsBase.length !== 1 ? 's' : ''}
                                  {commandShowAllSearch ? ` / ${commandCards.length}` : ''}
                                </span>
                              </div>
                              {/* Grid */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))',
                                gap: 8,
                                padding: '0 10px 12px',
                                maxHeight: 260,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                              }} className="custom-scroll">
                                {allDisplayItems.map(({ card }, idx) => {
                                  const isNpcSpecialCard = !!(card as any).__npcSpecial;
                                  const cfg = typeConfig[card.type] || typeConfig['ação'];
                                  const ammoCostCard = card.ammoCost || 0;
                                  const canAfford = isNpcSpecialCard || (actor.currentAura >= card.auraCost && (ammoCostCard === 0 || (actor.maxAmmo || 0) === 0 || (actor.currentAmmo ?? 0) >= ammoCostCard));
                                  const isPinned = !isNpcSpecialCard && (actor.pinnedCardIds || []).includes(card.id);
                                  const handleClick = () => {
                                    if (isNpcSpecialCard) {
                                      if ((card as any).__npcSpecial === 'wildcard') setNpcWildcardModal({ actor, command: (card as any).__command });
                                      else if ((card as any).__npcSpecial === 'contra-ataque') setNpcSpecialCardModal({ actor, cardType: 'contra-ataque' });
                                      else if ((card as any).__npcSpecial === 'armadura') setNpcSpecialCardModal({ actor, cardType: 'armadura' });
                                    } else {
                                      if (canAfford) initiateCardUsage(card); else alert('Aura insuficiente!');
                                    }
                                  };
                                  return (
                                    <div
                                      key={card.id}
                                      onClick={handleClick}
                                      style={{
                                        background: cfg.bg,
                                        border: `1.5px solid ${isPinned ? 'rgba(251,191,36,0.8)' : canAfford ? cfg.border : 'rgba(255,255,255,0.05)'}`,
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        cursor: canAfford ? 'pointer' : 'not-allowed',
                                        filter: canAfford ? 'none' : 'grayscale(0.8) opacity(0.35)',
                                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                        boxShadow: isPinned
                                          ? `0 4px 16px rgba(251,191,36,0.3), 0 0 0 1.5px rgba(251,191,36,0.5)`
                                          : canAfford ? `0 4px 14px rgba(0,0,0,0.7), 0 0 12px ${cfg.glow}18` : `0 2px 8px rgba(0,0,0,0.5)`,
                                        animation: `cardDealIn 0.3s cubic-bezier(0.22,1,0.36,1) ${idx * 0.035}s both`,
                                        position: 'relative',
                                      }}
                                      className="hover:scale-105 hover:brightness-110"
                                    >
                                      {/* Top bar */}
                                      {isPinned
                                        ? <div style={{ height:2.5, background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.9),transparent)' }} />
                                        : canAfford && <div style={{ height:2, background:`linear-gradient(90deg,transparent,${cfg.topColor},transparent)`, opacity:0.9 }} />
                                      }
                                      {/* Image */}
                                      <div style={{ width:'100%', height:70, overflow:'hidden', position:'relative' }}>
                                        <img src={card.image || undefined} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                        <div style={{ position:'absolute', inset:0, background:`linear-gradient(0deg,${cfg.topColor}28,transparent 60%)` }} />
                                        {isPinned && (
                                          <div style={{ position:'absolute', top:3, right:3, background:'rgba(0,0,0,0.7)', borderRadius:4, padding:'1px 3px' }}>
                                            <Pin style={{ width:8, height:8, color:'#fbbf24' }} />
                                          </div>
                                        )}
                                      </div>
                                      {/* Info */}
                                      <div style={{ padding:'5px 6px 7px' }}>
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                                          <span style={{ fontSize:7, fontWeight:700, textTransform:'uppercase', color:cfg.topColor, background:`${cfg.topColor}18`, border:`1px solid ${cfg.border}55`, borderRadius:3, padding:'1px 4px', letterSpacing:'0.06em' }}>{cfg.label}</span>
                                          <span style={{ display:'flex', alignItems:'center', gap:1, fontSize:9, fontWeight:700, color:canAfford?'#67e8f9':'#f87171', fontFamily:"'JetBrains Mono',monospace" }}>
                                            <Zap style={{width:7,height:7}}/>{card.auraCost}
                                          </span>
                                        </div>
                                        <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', fontStyle:'italic', color:canAfford?'#fff':'#334155', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'0.02em' }}>{card.name}</p>
                                        {card.diceRoll && <p style={{ fontSize:7, color:'rgba(255,255,255,0.25)', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>{card.diceRoll}</p>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div style={{ position:'relative', width:'100%', display:'flex', flexDirection:'column', alignItems:'center', overflow:'visible' }}>
                          {/* FLAT ROW MODE: when a command is active, show cards side by side */}
                          {activeCommand && !commandShowAll ? (
                            <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', animation:'cardDealIn 0.28s ease both' }}>
                              {hasMoreCards && (
                                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:9, color:'rgba(160,200,255,0.6)', fontWeight:700, letterSpacing:'0.06em', marginBottom:6, background:'rgba(100,148,255,0.08)', border:'1px solid rgba(100,148,255,0.2)', borderRadius:8, padding:'3px 10px' }}>
                                  <Layers style={{ width:9, height:9, opacity:0.7 }} />
                                  +{commandCardsBase.length - visibleCards.length} carta{commandCardsBase.length - visibleCards.length !== 1 ? 's' : ''} · clique no comando para ver todas
                                </div>
                              )}
                              <div style={{ display:'flex', gap:8, justifyContent:'center', alignItems:'flex-end', flexWrap:'wrap', padding:'4px 12px 8px' }}>
                                {displayItems.map(({ card }, idx) => {
                                  const isNpcSpecialCard = !!(card as any).__npcSpecial;
                                  const cfg2 = typeConfig[card.type] || typeConfig['ação'];
                                  const ammoCostCard2 = card.ammoCost || 0;
                                  const canAfford2 = isNpcSpecialCard || (actor.currentAura >= card.auraCost && (ammoCostCard2 === 0 || (actor.maxAmmo || 0) === 0 || (actor.currentAmmo ?? 0) >= ammoCostCard2));
                                  const isPinned2 = !isNpcSpecialCard && (actor.pinnedCardIds || []).includes(card.id);
                                  const isHov2 = hoveredCardIdx === idx;
                                  return (
                                    <div
                                      key={card.id}
                                      onMouseEnter={() => setHoveredCardIdx(idx)}
                                      onMouseLeave={() => setHoveredCardIdx(null)}
                                      onClick={() => {
                                        if (isNpcSpecialCard) {
                                          if ((card as any).__npcSpecial === 'wildcard') setNpcWildcardModal({ actor, command: (card as any).__command });
                                          else if ((card as any).__npcSpecial === 'contra-ataque') setNpcSpecialCardModal({ actor, cardType: 'contra-ataque' });
                                          else if ((card as any).__npcSpecial === 'armadura') setNpcSpecialCardModal({ actor, cardType: 'armadura' });
                                        } else {
                                          if (canAfford2) initiateCardUsage(card); else alert('Aura insuficiente!');
                                        }
                                      }}
                                      style={{
                                        width: isHov2 ? 146 : 118,
                                        height: isHov2 ? 244 : 172,
                                        flexShrink: 0,
                                        animation: `cardDealIn 0.38s cubic-bezier(0.22,1,0.36,1) ${idx * 0.07}s both`,
                                        cursor: canAfford2 ? 'pointer' : 'not-allowed',
                                        filter: canAfford2 ? 'none' : 'grayscale(0.85) opacity(0.3)',
                                        borderRadius: 16,
                                        background: cfg2.bg,
                                        border: isNpcSpecialCard ? `1.5px dashed ${cfg2.border}` : `1.5px solid ${isPinned2 ? 'rgba(251,191,36,0.8)' : canAfford2 ? cfg2.border : 'rgba(255,255,255,0.05)'}`,
                                        boxShadow: isHov2
                                          ? `0 -24px 70px ${cfg2.glow}55, 0 0 0 2px ${cfg2.border}, 0 40px 80px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.1)`
                                          : isPinned2 ? `0 6px 24px rgba(0,0,0,0.85), 0 0 16px rgba(251,191,36,0.35)`
                                          : canAfford2 ? `0 6px 24px rgba(0,0,0,0.85), 0 0 16px ${cfg2.glow}18`
                                          : `0 4px 12px rgba(0,0,0,0.6)`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                                        zIndex: isHov2 ? 20 : idx + 1,
                                        position: 'relative',
                                      }}
                                    >
                                      {isPinned2
                                        ? <div style={{ height:2.5, background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.9),transparent)', flexShrink:0 }} />
                                        : canAfford2 && <div style={{ height:2, background:`linear-gradient(90deg,transparent,${cfg2.topColor},transparent)`, opacity:0.9, flexShrink:0 }} />
                                      }
                                      <div style={{ width:'100%', height: isHov2 ? 110 : 70, overflow:'hidden', position:'relative', flexShrink:0, transition:'height 0.25s ease' }}>
                                        <img src={card.image || undefined} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                        <div style={{ position:'absolute', inset:0, background:`linear-gradient(0deg,${cfg2.topColor}28,transparent 60%)` }} />
                                        {isPinned2 && <div style={{ position:'absolute', top:3, right:3, background:'rgba(0,0,0,0.7)', borderRadius:4, padding:'1px 3px' }}><Pin style={{ width:8, height:8, color:'#fbbf24' }} /></div>}
                                      </div>
                                      <div style={{ padding:'5px 7px 7px', flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                                          <span style={{ fontSize:7, fontWeight:700, textTransform:'uppercase', color:cfg2.topColor, background:`${cfg2.topColor}18`, border:`1px solid ${cfg2.border}55`, borderRadius:3, padding:'1px 4px', letterSpacing:'0.06em' }}>{cfg2.label}</span>
                                          <span style={{ display:'flex', alignItems:'center', gap:1, fontSize:9, fontWeight:700, color:canAfford2?'#67e8f9':'#f87171', fontFamily:"'JetBrains Mono',monospace" }}>
                                            <Zap style={{width:7,height:7}}/>{card.auraCost}
                                          </span>
                                        </div>
                                        <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', fontStyle:'italic', color:canAfford2?'#fff':'#334155', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'0.02em' }}>{card.name}</p>
                                        {isHov2 && card.description && <p style={{ fontSize:8, color:'rgba(255,255,255,0.45)', lineHeight:1.4, marginTop:4, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' } as any}>{card.description}</p>}
                                        {isHov2 && card.damage > 0 && <p style={{ fontSize:8, fontWeight:700, color:'#f87171', marginTop:3 }}>⚔ {card.damage} dano</p>}
                                        <p style={{ fontSize:7, color:'rgba(255,255,255,0.25)', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>{card.diceRoll}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                          // FAN MODE: no active command, show card arc
                          <>
                          {hasMoreCards && (
                            <div style={{ 
                              display:'flex', alignItems:'center', gap:5,
                              fontSize:9, color:'rgba(160,200,255,0.6)', fontWeight:700, letterSpacing:'0.06em', 
                              marginBottom:3, textAlign:'center',
                              background:'rgba(100,148,255,0.08)', border:'1px solid rgba(100,148,255,0.2)',
                              borderRadius:8, padding:'3px 10px',
                            }}>
                              <Layers style={{ width:9, height:9, opacity:0.7 }} />
                              +{commandCardsBase.length - visibleCards.length} carta{commandCardsBase.length - visibleCards.length !== 1 ? 's' : ''} · clique no comando para ver todas
                            </div>
                          )}
                          <div style={{ position:'relative', width:'100%', height:CARD_H + 30, display:'flex', alignItems:'flex-end', justifyContent:'center', overflow:'visible' }}>
                            {displayItems.map((item, idx) => {
                              const normPos = total === 1 ? 0 : (idx / (total - 1)) - 0.5;
                              const angleDeg = normPos * fanSpreadDeg;
                              const angleRad = (angleDeg * Math.PI) / 180;
                              const yLift = (1 - Math.cos(angleRad)) * 20;
                              const baseX = (idx - (total - 1) / 2) * cardStep;
                              const isHov = hoveredCardIdx === idx;
                              const zIdx = isHov ? 100 : idx + 1;
                              const hovW = CARD_W + 28;
                              const hovH = CARD_H + 72;

                              const card = item.card;
                              const isNpcSpecialCard = !!(card as any).__npcSpecial;
                              const cfg = typeConfig[card.type] || typeConfig['ação'];
                              const ammoCostCard = card.ammoCost || 0;
                              const canAfford = isNpcSpecialCard || (actor.currentAura >= card.auraCost && (ammoCostCard === 0 || (actor.maxAmmo || 0) === 0 || (actor.currentAmmo ?? 0) >= ammoCostCard));
                              const isPinned = !isNpcSpecialCard && (actor.pinnedCardIds || []).includes(card.id);
                              const pinnedCount = (actor.pinnedCardIds || []).length;

                              const handleCardClick = () => {
                                if (isNpcSpecialCard) {
                                  if ((card as any).__npcSpecial === 'wildcard') {
                                    setNpcWildcardModal({ actor, command: (card as any).__command });
                                  } else if ((card as any).__npcSpecial === 'contra-ataque') {
                                    setNpcSpecialCardModal({ actor, cardType: 'contra-ataque' });
                                  } else if ((card as any).__npcSpecial === 'armadura') {
                                    setNpcSpecialCardModal({ actor, cardType: 'armadura' });
                                  }
                                } else {
                                  if (canAfford) initiateCardUsage(card); else alert('Aura insuficiente!');
                                }
                              };

                              return (
                                <div
                                  key={card.id}
                                  onMouseEnter={() => setHoveredCardIdx(idx)}
                                  onMouseLeave={() => setHoveredCardIdx(null)}
                                  onClick={handleCardClick}
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: '50%',
                                    width: isHov ? hovW : CARD_W,
                                    height: isHov ? hovH : CARD_H,
                                    marginLeft: (isHov ? hovW : CARD_W) / -2,
                                    transform: `translateX(${baseX}px) translateY(${isHov ? -56 : yLift}px) rotate(${isHov ? 0 : angleDeg * 0.62}deg)`,
                                    transformOrigin: 'bottom center',
                                    transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), width 0.3s cubic-bezier(0.22,1,0.36,1), height 0.3s cubic-bezier(0.22,1,0.36,1), margin-left 0.3s ease, box-shadow 0.32s ease, border-color 0.2s ease, filter 0.2s ease',
                                    animation: isHov ? `cardDealIn 0.4s cubic-bezier(0.22,1,0.36,1) ${idx * 0.07}s both, cardHoverFloat 3.2s 0.5s ease-in-out infinite` : `cardDealIn 0.4s cubic-bezier(0.22,1,0.36,1) ${idx * 0.07}s both`,
                                    zIndex: zIdx,
                                    cursor: canAfford ? 'pointer' : 'not-allowed',
                                    filter: canAfford ? 'none' : 'grayscale(0.85) opacity(0.3)',
                                    borderRadius: 16,
                                    background: cfg.bg,
                                    border: isNpcSpecialCard ? `1.5px dashed ${cfg.border}` : `1.5px solid ${isPinned ? 'rgba(251,191,36,0.8)' : canAfford ? cfg.border : 'rgba(255,255,255,0.05)'}`,
                                    boxShadow: isHov
                                      ? `0 -24px 70px ${cfg.glow}55, 0 0 0 2px ${cfg.border}, 0 40px 80px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.1)`
                                      : isPinned
                                      ? `0 6px 24px rgba(0,0,0,0.85), 0 0 16px rgba(251,191,36,0.35), inset 0 1px 0 rgba(255,255,255,0.05)`
                                      : canAfford
                                      ? `0 6px 24px rgba(0,0,0,0.85), 0 0 16px ${cfg.glow}18, inset 0 1px 0 rgba(255,255,255,0.05)`
                                      : `0 4px 12px rgba(0,0,0,0.6)`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {isPinned && !isHov && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.9),rgba(255,255,255,0.6),rgba(251,191,36,0.9),transparent)', opacity:1, zIndex:2 }} />}
                                  {isHov && <div style={{ position:'absolute', inset:0, borderRadius:14, pointerEvents:'none', zIndex:15, overflow:'hidden' }}><div style={{ position:'absolute', top:0, left:0, width:'60%', height:'100%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.055),transparent)', animation:'cardShimmerSweep 2.8s 0.4s ease-in-out infinite' }} /></div>}
                                  {canAfford && !isPinned && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${cfg.topColor},rgba(255,255,255,0.7),${cfg.topColor},transparent)`, opacity:0.9, zIndex:1 }} />}
                                  <div style={{ width:'100%', padding:'8px 10px 6px', background:cfg.headerBg, borderBottom:`1px solid ${cfg.border}44`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                      <span style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:cfg.topColor, padding:'2px 6px', borderRadius:4, background:`${cfg.topColor}18`, border:`1px solid ${cfg.border}55` }}>{cfg.label}</span>
                                      {isPinned && <Pin style={{ width:8, height:8, color:'#fbbf24', flexShrink:0 }} />}
                                      {card.isAreaEffect && <span style={{ fontSize:6, fontWeight:700, color:'#fb923c', background:'rgba(234,88,12,0.2)', border:'1px solid rgba(234,88,12,0.4)', borderRadius:3, padding:'1px 4px' }}>💥</span>}
                                      {card.type === 'combinação' && <span style={{ fontSize:6, fontWeight:700, color:'#c084fc', background:'rgba(192,132,252,0.15)', border:'1px solid rgba(192,132,252,0.4)', borderRadius:3, padding:'1px 4px' }}>🔗</span>}
                                      {card.type === 'forma' && <span style={{ fontSize:6, fontWeight:700, color:card.formaColor||'#f59e0b', background:(card.formaColor||'#f59e0b')+'22', border:`1px solid ${card.formaColor||'#f59e0b'}55`, borderRadius:3, padding:'1px 4px' }}>✦</span>}
                                      {card.levels && card.levels.length > 0 && <span style={{ fontSize:6, fontWeight:700, color:'#fcd34d', background:'rgba(201,152,58,0.15)', border:'1px solid rgba(201,152,58,0.4)', borderRadius:3, padding:'1px 4px' }}>{card.levels.length+1}nv</span>}
                                      {card.bonuses && card.bonuses.length > 0 && <span style={{ fontSize:6, fontWeight:700, color:'#4ade80', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.4)', borderRadius:3, padding:'1px 4px' }}>🎁</span>}
                                      {(card as any).element && <span style={{ fontSize:9, lineHeight:1 }}>
                                        {(card as any).element === 'fogo' ? '🔥' : (card as any).element === 'água' ? '💧' : (card as any).element === 'terra' ? '🪨' : (card as any).element === 'vento' ? '🍃' : (card as any).element === 'raio' ? '⚡' : ''}
                                      </span>}
                                      {(card as any).damageType && (card as any).damageType !== 'normal' && (() => {
                                        const dt = DAMAGE_TYPES.find(d => d.value === (card as any).damageType);
                                        return dt ? <span style={{ fontSize:8, lineHeight:1, color:dt.color, fontWeight:700 }} title={dt.label}>{dt.emoji}</span> : null;
                                      })()}
                                    </div>
                                    <div style={{ display:'flex', flexDirection:'column', gap:2, alignItems:'flex-end' }}>
                                      <div style={{ display:'flex', alignItems:'center', gap:2, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:canAfford?'#67e8f9':'#f87171', background:'rgba(0,0,0,0.5)', borderRadius:5, padding:'1px 5px', border:`1px solid ${canAfford?'rgba(103,232,249,0.2)':'rgba(248,113,113,0.2)'}` }}>
                                        <Zap style={{width:7,height:7}}/>{card.auraCost}
                                      </div>
                                      {ammoCostCard > 0 && (
                                        <div style={{ display:'flex', alignItems:'center', gap:2, fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:'#f97316', background:'rgba(0,0,0,0.4)', borderRadius:5, padding:'1px 5px' }}>
                                          🎯{ammoCostCard}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ width:'100%', height: isHov ? 96 : 78, flexShrink:0, overflow:'hidden', position:'relative', borderBottom:`1px solid ${cfg.border}33` }}>
                                    <img src={card.image||null} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                    <div style={{ position:'absolute', inset:0, background:`linear-gradient(0deg,${cfg.topColor}28,transparent 60%)` }} />
                                  </div>
                                  <div style={{ flex:1, width:'100%', padding: isHov ? '9px 10px 8px' : '7px 8px 6px', display:'flex', flexDirection:'column', gap: isHov ? 5 : 3 }}>
                                    <p style={{ fontSize:isHov?12:9, fontWeight:700, textTransform:'uppercase', fontStyle:'italic', color:canAfford?'#fff':'#334155', lineHeight:1.2, letterSpacing:'0.03em', textShadow:isHov?cfg.nameShadow:'none', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace: isHov?'normal':'nowrap' }}>{card.name}</p>
                                    <p style={{ fontSize:8, color:'rgba(255,255,255,0.28)', fontFamily:"'JetBrains Mono',monospace", textAlign:'center' }}>{card.diceRoll}</p>
                                    {isHov && (
                                      <div style={{ marginTop:3, width:'100%', fontSize:9, borderTop:`1px solid ${cfg.border}44`, paddingTop:6, display:'flex', flexDirection:'column', gap:4 }}>
                                        {card.damage > 0 && (
                                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'2px 0' }}>
                                            <span style={{ color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', fontSize:8 }}>⚔ Dano</span>
                                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                              {(card as any).damageType && (card as any).damageType !== 'normal' && (() => {
                                                const dt = DAMAGE_TYPES.find(d => d.value === (card as any).damageType);
                                                return dt ? <span style={{ fontSize:8, color:dt.color, fontWeight:700 }}>{dt.emoji} {dt.label}</span> : null;
                                              })()}
                                              <span style={{ color:'#f87171', fontWeight:700, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>{card.damage}</span>
                                            </div>
                                          </div>
                                        )}
                                        {card.dc && (
                                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'2px 0' }}>
                                            <span style={{ color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', fontSize:8 }}>◎ CD</span>
                                            <span style={{ color:'#e8c878', fontWeight:700, fontSize:11 }}>{card.dc}</span>
                                          </div>
                                        )}
                                        {card.conditionEffect && (
                                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'2px 0' }}>
                                            <span style={{ color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', fontSize:8 }}>✦ Efeito</span>
                                            <span style={{ color:'#f59e0b', fontWeight:700, fontSize:9 }}>{card.conditionEffect} ({card.conditionDuration}t)</span>
                                          </div>
                                        )}
                                        {card.description && (
                                          <p style={{ color:'rgba(255,255,255,0.32)', fontSize:8, lineHeight:1.45, fontStyle:'italic', marginTop:2, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:5 }}>
                                            {card.description.slice(0,90)}{card.description.length > 90 ? '…' : ''}
                                          </p>
                                        )}
                                        <div style={{ marginTop:4, display:'flex', gap:6, alignItems:'center', justifyContent:'center' }}>
                                          {isNpcSpecialCard ? (
                                            <div style={{ textAlign:'center', fontSize:8, fontWeight:700, color:cfg.topColor, textTransform:'uppercase', letterSpacing:'0.2em', opacity:0.9 }}>
                                              {(card as any).__npcSpecial === 'wildcard' ? '✦ Criar Habilidade →' : '⚙ Configurar e Usar →'}
                                            </div>
                                          ) : (
                                            <>
                                              <div style={{ textAlign:'center', fontSize:8, fontWeight:700, color:cfg.topColor, textTransform:'uppercase', letterSpacing:'0.2em', opacity:0.7 }}>
                                                Clique para usar →
                                              </div>
                                              <button
                                                onClick={e => { e.stopPropagation(); handleTogglePinCard(actor.combatId, card.id); }}
                                                title={isPinned ? 'Desafixar da mão' : pinnedCount >= 7 ? 'Mão cheia (máx. 7)' : 'Fixar na mão'}
                                                style={{
                                                  display:'flex', alignItems:'center', gap:3,
                                                  padding:'2px 7px', borderRadius:6,
                                                  border: isPinned ? '1px solid rgba(251,191,36,0.6)' : '1px solid rgba(255,255,255,0.12)',
                                                  background: isPinned ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                                                  color: isPinned ? '#fbbf24' : 'rgba(255,255,255,0.35)',
                                                  fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
                                                  cursor: (!isPinned && pinnedCount >= 7) ? 'not-allowed' : 'pointer',
                                                  opacity: (!isPinned && pinnedCount >= 7) ? 0.4 : 1,
                                                  transition:'all 0.2s',
                                                  flexShrink:0,
                                                }}
                                              >
                                                {isPinned ? <PinOff style={{width:8,height:8}} /> : <Pin style={{width:8,height:8}} />}
                                                {isPinned ? 'Soltar' : 'Fixar'}
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {canAfford && isHov && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2.5, background:`linear-gradient(90deg,transparent,${cfg.topColor},transparent)` }} />}
                                  {/* Element hover glow */}
                                  {isHov && canAfford && (card as any).element && (() => {
                                    const elColors: Record<string,{c:string,g:string}> = {fogo:{c:'#ef4444',g:'rgba(239,68,68,0.6)'},água:{c:'#3b82f6',g:'rgba(59,130,246,0.6)'},terra:{c:'#92400e',g:'rgba(146,64,14,0.55)'},vento:{c:'#86efac',g:'rgba(134,239,172,0.5)'},raio:{c:'#facc15',g:'rgba(250,204,21,0.7)'}};
                                    const el = elColors[(card as any).element];
                                    if (!el) return null;
                                    return (
                                      <div style={{ position:'absolute', inset:0, borderRadius:14, pointerEvents:'none', zIndex:20,
                                        boxShadow:`0 0 32px ${el.g}, inset 0 0 16px ${el.g}55`,
                                        border:`1.5px solid ${el.c}99`,
                                        background:`radial-gradient(ellipse at 50% 30%, ${el.g}22 0%, transparent 65%)`,
                                        animation:'el-card-hover-pulse 1.5s ease-in-out infinite' }} />
                                    );
                                  })()}
                                </div>
                              );
                            })}
                          </div>
                          </> // end FAN MODE
                          )} {/* end activeCommand ternary */}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

            </div>{/* /BARRA OVERLAY */}
            </div>{/* /CENTRO: ARENA + SIDEBAR */}

            {/* ══ BOTTOM HUD — Status do Personagem Ativo ══════════════════ */}
            {combat.isActive && (
              <div
                key={`hud-${turnChangeKey}`}
                style={{
                  flexShrink: 0,
                  height: 140,
                  background: 'var(--bg-surface)',
                  borderTop: `2px solid ${turnFlashing ? 'rgba(201,152,58,0.9)' : 'rgba(201,152,58,0.2)'}`,
                  display: 'flex',
                  gap: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.4s ease',
                  animation: 'hudSlideIn 0.35s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                {/* Turn flash overlay */}
                {turnFlashing && (
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50,
                    background: 'linear-gradient(90deg, rgba(201,152,58,0.0) 0%, rgba(201,152,58,0.18) 50%, rgba(201,152,58,0.0) 100%)',
                    animation: 'turnFlashSweep 0.7s ease forwards',
                  }} />
                )}

                {/* Blur/darken overlay when command list is active */}
                {activeCommand && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none',
                    background: 'rgba(8,10,16,0.62)',
                    backdropFilter: 'blur(6px)',
                    animation: 'fadeIn 0.25s ease',
                  }} />
                )}

                {/* BG atmospheric glow */}
                <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:`radial-gradient(ellipse at 0% 50%, ${currentActor ? 'rgba(201,152,58,0.06)' : 'transparent'} 0%, transparent 60%)` }} />

                {currentActor ? (() => {
                  const actor = currentActor;
                  const hpPct = Math.max(0, actor.maxHp > 0 ? (actor.currentHp / actor.maxHp) * 100 : 0);
                  const auraPct = Math.max(0, actor.maxAura > 0 ? (actor.currentAura / actor.maxAura) * 100 : 0);
                  const hpColor = hpPct <= 20 ? '#ef4444' : hpPct <= 50 ? '#f59e0b' : '#22c55e';
                  const CIRC_SIZE = 108;
                  const STROKE = 8;
                  const R = (CIRC_SIZE - STROKE * 2) / 2;
                  const CIRC = 2 * Math.PI * R;
                  const stacks = actor.stacks || [];
                  const conditions = actor.conditions || [];

                  return (
                    <div style={{ display:'flex', flex:1, gap:0, padding:'10px 18px', alignItems:'center' }}>

                      {/* ── LEFT: Circular HP + Avatar ── */}
                      <div style={{ position:'relative', flexShrink:0, width:CIRC_SIZE, height:CIRC_SIZE, marginRight:16, animation:`hudTokenIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both` }}>
                        {/* Outer glow ring on turn change */}
                        <div style={{
                          position:'absolute', inset:-4, borderRadius:'50%',
                          boxShadow: turnFlashing ? `0 0 32px 8px ${hpColor}88` : `0 0 12px 2px ${hpColor}44`,
                          transition: 'box-shadow 0.5s ease',
                          pointerEvents:'none',
                        }} />
                        <svg width={CIRC_SIZE} height={CIRC_SIZE} style={{ position:'absolute', inset:0, transform:'rotate(-90deg)' }}>
                          <circle cx={CIRC_SIZE/2} cy={CIRC_SIZE/2} r={R} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={STROKE} />
                          <circle cx={CIRC_SIZE/2} cy={CIRC_SIZE/2} r={R} fill="none"
                            stroke={hpColor} strokeWidth={STROKE}
                            strokeDasharray={`${(hpPct/100)*CIRC} ${CIRC}`}
                            strokeLinecap="round"
                            style={{ filter:`drop-shadow(0 0 6px ${hpColor}cc)`, transition:'stroke-dasharray 0.6s ease, stroke 0.3s ease' }}
                          />
                        </svg>
                        {/* Avatar */}
                        <div style={{ position:'absolute', inset:STROKE+3, borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(20,24,34,0.9)' }}>
                          <img src={actor.icon||undefined} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        </div>
                        {/* HP text */}
                        <div style={{ position:'absolute', bottom:-8, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.9)', border:`1px solid ${hpColor}66`, borderRadius:99, padding:'2px 10px', whiteSpace:'nowrap' }}>
                          <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", fontWeight:900, color:hpColor }}>{actor.currentHp}</span>
                          <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', margin:'0 2px' }}>/</span>
                          <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'rgba(255,255,255,0.45)' }}>{actor.maxHp}</span>
                        </div>
                        {/* Name below */}
                        <div style={{ position:'absolute', top:-22, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', animation:'hudNameIn 0.4s ease both' }}>
                          <span style={{ fontSize:9, fontWeight:900, color:'#fdf0cc', textTransform:'uppercase', letterSpacing:'0.12em', textShadow:'0 0 12px rgba(212,168,83,0.6)' }}>{actor.name}</span>
                        </div>
                        {/* HP adjust buttons */}
                        <div style={{ position:'absolute', bottom:-28, left:'50%', transform:'translateX(-50%)', display:'flex', gap:2, whiteSpace:'nowrap' }}>
                          {([-5,-1,1,5] as const).map(d => (
                            <button key={d} onClick={()=>adjustCombatantStat(actor.combatId,'hp',d)}
                              style={{ padding:'1px 5px', fontSize:8, fontWeight:900, borderRadius:3, cursor:'pointer', lineHeight:1.2,
                                border:'1px solid', borderColor:d<0?'rgba(239,68,68,0.4)':'rgba(34,197,94,0.4)',
                                background:d<0?'rgba(239,68,68,0.12)':'rgba(34,197,94,0.12)',
                                color:d<0?'#fca5a5':'#86efac', transition:'all 0.15s' }}
                            >{d>0?`+${d}`:d}</button>
                          ))}
                        </div>
                      </div>

                      {/* ── CENTER: Aura + Ammo + Stacks + Conditions ── */}
                      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, justifyContent:'center', paddingTop:4, animation:'hudStatsIn 0.45s ease both' }}>

                        {/* Ammo (if exists) — shown as large number above aura */}
                        {(actor.maxAmmo || 0) > 0 && (
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                            <span style={{ fontSize:16 }}>🎯</span>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:900, color:'#f97316', lineHeight:1, letterSpacing:'-0.02em' }}>{actor.currentAmmo ?? 0}</span>
                            <span style={{ fontSize:11, color:'rgba(249,115,22,0.4)', fontWeight:700 }}>/{actor.maxAmmo}</span>
                            <div style={{ display:'flex', gap:2, marginLeft:4 }}>
                              {([-5,-1,1,5] as const).map(d => (
                                <button key={d} onClick={()=>adjustCombatantStat(actor.combatId,'ammo',d)}
                                  style={{ padding:'2px 5px', fontSize:8, fontWeight:900, borderRadius:3, cursor:'pointer',
                                    border:'1px solid', borderColor:d<0?'rgba(249,115,22,0.4)':'rgba(249,115,22,0.6)',
                                    background:d<0?'rgba(249,115,22,0.1)':'rgba(249,115,22,0.18)',
                                    color:'#fdba74' }}
                                >{d>0?`+${d}`:d}</button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Aura bar — large horizontal */}
                        <div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <Zap style={{ width:11, height:11, color:'#60a5fa' }} />
                              <span style={{ fontSize:8, fontWeight:700, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.18em' }}>AURA</span>
                            </div>
                            <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:900, color:'#93c5fd', lineHeight:1 }}>{actor.currentAura}</span>
                              <span style={{ fontSize:10, color:'rgba(147,197,253,0.4)', fontWeight:700 }}>/{actor.maxAura}</span>
                            </div>
                          </div>
                          <div style={{ height:12, background:'rgba(0,0,0,0.6)', borderRadius:99, overflow:'hidden', border:'1px solid rgba(59,130,246,0.25)', position:'relative' }}>
                            <div style={{ height:'100%', borderRadius:99, width:`${auraPct}%`, background:'linear-gradient(90deg,#1d4ed8,#60a5fa,#93c5fd)', boxShadow:'0 0 10px rgba(96,165,250,0.6)', transition:'width 0.6s ease' }} />
                            {/* Aura shimmer */}
                            <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.08) 50%,transparent 100%)', animation:'barShimmer 3s ease-in-out infinite', pointerEvents:'none' }} />
                          </div>
                          <div style={{ display:'flex', gap:3, marginTop:3 }}>
                            {([-5,-1,1,5] as const).map(d => (
                              <button key={d} onClick={()=>adjustCombatantStat(actor.combatId,'aura',d)}
                                style={{ flex:1, padding:'2px 0', fontSize:8, fontWeight:900, borderRadius:3, cursor:'pointer',
                                  border:'1px solid', borderColor:d<0?'rgba(59,130,246,0.35)':'rgba(59,130,246,0.55)',
                                  background:d<0?'rgba(59,130,246,0.08)':'rgba(59,130,246,0.16)',
                                  color:'#93c5fd', transition:'all 0.15s' }}
                              >{d>0?`+${d}`:d}</button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ── RIGHT: Stacks + Conditions ── */}
                      <div style={{ flexShrink:0, display:'flex', flexDirection:'column', gap:8, paddingLeft:16, paddingTop:4, borderLeft:'1px solid rgba(255,255,255,0.06)', minWidth:180, maxWidth:260, animation:'hudSideIn 0.5s ease both' }}>

                        {/* Stacks as colored dots */}
                        {stacks.length > 0 && (
                          <div>
                            <p style={{ fontSize:7, fontWeight:700, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:6 }}>Stacks</p>
                            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                              {stacks.map(stack => {
                                const dots = Array.from({ length: stack.max }, (_, i) => i < stack.current);
                                return (
                                  <div key={stack.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                    <span style={{ fontSize:8, fontWeight:700, color:stack.color, textTransform:'uppercase', letterSpacing:'0.1em', minWidth:40, flexShrink:0 }}>{stack.name}</span>
                                    <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                                      {dots.map((filled, idx) => (
                                        <button
                                          key={idx}
                                          title={filled ? `Remover 1 ${stack.name}` : `Adicionar 1 ${stack.name}`}
                                          onClick={() => {
                                            if (!combat) return;
                                            const newVal = filled
                                              ? Math.max(0, stack.current - 1)
                                              : Math.min(stack.max, stack.current + 1);
                                            const newCombatants = combat.combatants.map(cb =>
                                              cb.combatId === actor.combatId
                                                ? { ...cb, stacks: (cb.stacks||[]).map(s => s.id === stack.id ? { ...s, current: newVal } : s) }
                                                : cb
                                            );
                                            updateCombat({ ...combat, combatants: newCombatants });
                                          }}
                                          style={{
                                            width: 14, height: 14, borderRadius: '50%', cursor: 'pointer', border: 'none', padding: 0,
                                            background: filled ? stack.color : 'rgba(255,255,255,0.06)',
                                            boxShadow: filled ? `0 0 8px ${stack.color}88` : 'none',
                                            transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                                            transform: filled ? 'scale(1)' : 'scale(0.85)',
                                          }}
                                        />
                                      ))}
                                    </div>
                                    <span style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:stack.color, marginLeft:'auto' }}>{stack.current}/{stack.max}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Conditions */}
                        {conditions.length > 0 && (
                          <div>
                            <p style={{ fontSize:7, fontWeight:700, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:6 }}>Condições</p>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                              {conditions.map(cond => {
                                const preset = PRESET_CONDITIONS.find(p => p.name === cond.name);
                                const col = preset?.color || '#f87171';
                                return (
                                  <div key={cond.name} style={{
                                    display:'flex', alignItems:'center', gap:4,
                                    background:`${col}18`, border:`1px solid ${col}55`,
                                    borderRadius:8, padding:'3px 8px',
                                    animation:'condIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
                                  }}>
                                    <span style={{ fontSize:11 }}>{preset?.emoji || '⚠'}</span>
                                    <span style={{ fontSize:9, fontWeight:700, color:col, letterSpacing:'0.04em' }}>{cond.name}</span>
                                    <span style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:`${col}aa`, background:`${col}22`, borderRadius:4, padding:'0 4px' }}>{cond.duration}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {stacks.length === 0 && conditions.length === 0 && (
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', opacity:0.25 }}>
                            <span style={{ fontSize:9, color:'var(--text-faint)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em' }}>Sem stacks ou condições</span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })() : (
                  /* No active actor — show placeholder */
                  <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:12, opacity:0.2 }}>
                    <Swords style={{ width:20, height:20, color:'var(--gold-dim)' }} />
                    <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.25em' }}>Aguardando turno ativo</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ DECK MODAL — Full card browser ══ */}
        {showDeckModal && (() => {
          const actor = combat?.combatants.find(c=>c.combatId===(selectedCombatantId||currentActor?.combatId));
          if (!actor) return null;

          const typeConfig: Record<string,{bg:string,border:string,topColor:string,label:string}> = {
            'ataque': {bg:'linear-gradient(165deg,rgba(45,15,15,0.97),rgba(55,18,18,0.95))',border:'rgba(239,68,68,0.6)',topColor:'#ef4444',label:'ATK'},
            'ação':   {bg:'linear-gradient(165deg,rgba(40,30,5,0.97),rgba(60,45,5,0.95))',border:'rgba(234,179,8,0.6)',topColor:'#eab308',label:'AÇÃ'},
            'reação': {bg:'linear-gradient(165deg,rgba(5,15,40,0.97),rgba(8,22,55,0.95))',border:'rgba(59,130,246,0.6)',topColor:'#3b82f6',label:'REA'},
            'reforço':{bg:'linear-gradient(165deg,rgba(5,30,12,0.97),rgba(8,45,18,0.95))',border:'rgba(34,197,94,0.6)',topColor:'#22c55e',label:'REF'},
            'vínculo':{bg:'linear-gradient(165deg,rgba(20,22,28,0.97),rgba(30,32,40,0.95))',border:'rgba(148,163,184,0.6)',topColor:'#94a3b8',label:'VÍN'},
            'combinação':{bg:'linear-gradient(165deg,rgba(40,5,60,0.97),rgba(55,8,80,0.95))',border:'rgba(192,132,252,0.7)',topColor:'#c084fc',label:'CMB'},
            'forma':  {bg:'linear-gradient(165deg,rgba(40,25,0,0.97),rgba(60,38,0,0.95))',border:'rgba(245,158,11,0.7)',topColor:'#f59e0b',label:'FRM'},
          };

          const allActorCards = ['ataque','ação','reação','reforço','vínculo','combinação','forma'].flatMap(type =>
            (actor.cardIds||[])
              .map(id => cards.find(c=>c.id===id))
              .filter(c => c && c.type===type) as any[]
          );

          const filtered = allActorCards.filter(c => {
            const matchSearch = c.name.toLowerCase().includes(deckSearchTerm.toLowerCase()) || c.description?.toLowerCase().includes(deckSearchTerm.toLowerCase());
            const matchType = deckTypeFilter === 'all' || c.type === deckTypeFilter;
            return matchSearch && matchType;
          });

          return createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-end justify-center anim-fade"
              style={{ background:'rgba(4,3,2,0.88)', backdropFilter:'blur(20px)' }}
              onMouseDown={e => { if (e.target === e.currentTarget) setShowDeckModal(false); }}
            >
              <div
                className="anim-scale-in"
                style={{
                  width:'100%', maxWidth:1200,
                  maxHeight:'82vh',
                  background:'linear-gradient(180deg,rgba(22,27,38,0.99) 0%,rgba(20,24,34,0.95) 100%)',
                  border:'1px solid rgba(168,85,247,0.3)',
                  borderBottom:'none',
                  borderRadius:'28px 28px 0 0',
                  display:'flex', flexDirection:'column',
                  boxShadow:'0 -20px 80px rgba(168,85,247,0.2), 0 -4px 0 rgba(168,85,247,0.4)',
                  overflow:'hidden',
                }}
              >
                {/* Header */}
                <div style={{ padding:'16px 24px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, background:'rgba(22,27,38,0.97)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:'rgba(168,85,247,0.15)', border:'1px solid rgba(168,85,247,0.35)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(168,85,247,0.3)' }}>
                      <BookOpen style={{ width:18, height:18, color:'#c084fc' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize:16, fontWeight:700, color:'#fdf0cc', textTransform:'uppercase', fontStyle:'italic', letterSpacing:'0.04em' }}>Baralho Completo</h3>
                      <p style={{ fontSize:9, color:'rgba(168,85,247,0.6)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.25em', marginTop:1 }}>{actor.name} — {allActorCards.length} habilidades</p>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    {/* Search */}
                    <div style={{ position:'relative' }}>
                      <Search style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:'#475569' }} />
                      <input
                        type="text"
                        placeholder="Pesquisar habilidade..."
                        autoFocus
                        value={deckSearchTerm}
                        onChange={e => setDeckSearchTerm(e.target.value)}
                        style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:10, padding:'8px 12px 8px 30px', fontSize:11, color:'#e2e8f0', outline:'none', width:220, transition:'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor='rgba(168,85,247,0.6)'}
                        onBlur={e => e.target.style.borderColor='rgba(168,85,247,0.25)'}
                      />
                    </div>
                    {/* Close */}
                    <button
                      onClick={() => setShowDeckModal(false)}
                      style={{ width:36, height:36, borderRadius:10, background:'rgba(30,20,45,0.8)', border:'1px solid rgba(168,85,247,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#9d73d8', cursor:'pointer', transition:'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(220,38,38,0.3)'; (e.currentTarget as HTMLButtonElement).style.color='#f87171'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(30,20,45,0.8)'; (e.currentTarget as HTMLButtonElement).style.color='#9d73d8'; }}
                    >
                      <X style={{ width:14, height:14 }} />
                    </button>
                  </div>
                </div>

                {/* Type filter pills */}
                <div style={{ padding:'10px 24px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', gap:6, flexShrink:0, overflowX:'auto' }}>
                  {[
                    { id:'all', label:'Todos', color:'#c9983a', bg:'rgba(201,152,58,0.15)', border:'rgba(201,152,58,0.4)', count: allActorCards.length },
                    { id:'ataque', label:'Ataque', color:'#ef4444', bg:'rgba(239,68,68,0.12)', border:'rgba(239,68,68,0.35)', count: allActorCards.filter(c=>c.type==='ataque').length },
                    { id:'ação', label:'Ação', color:'#eab308', bg:'rgba(234,179,8,0.12)', border:'rgba(234,179,8,0.35)', count: allActorCards.filter(c=>c.type==='ação').length },
                    { id:'reação', label:'Reação', color:'#3b82f6', bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.35)', count: allActorCards.filter(c=>c.type==='reação').length },
                    { id:'reforço', label:'Reforço', color:'#22c55e', bg:'rgba(34,197,94,0.12)', border:'rgba(34,197,94,0.35)', count: allActorCards.filter(c=>c.type==='reforço').length },
                    { id:'vínculo', label:'Vínculo', color:'#94a3b8', bg:'rgba(148,163,184,0.12)', border:'rgba(148,163,184,0.35)', count: allActorCards.filter(c=>c.type==='vínculo').length },
                    { id:'combinação', label:'Combinação', color:'#c084fc', bg:'rgba(192,132,252,0.12)', border:'rgba(192,132,252,0.35)', count: allActorCards.filter(c=>c.type==='combinação').length },
                    { id:'forma', label:'Forma', color:'#f59e0b', bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.35)', count: allActorCards.filter(c=>c.type==='forma').length },
                  ].filter(f => f.count > 0 || f.id === 'all').map(f => (
                    <button
                      key={f.id}
                      onClick={() => setDeckTypeFilter(f.id as any)}
                      style={{
                        padding:'5px 12px', borderRadius:20, fontSize:9, fontWeight:700,
                        textTransform:'uppercase', letterSpacing:'0.12em', cursor:'pointer',
                        flexShrink:0, display:'flex', alignItems:'center', gap:5,
                        background: deckTypeFilter === f.id ? f.bg : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${deckTypeFilter === f.id ? f.border : 'rgba(255,255,255,0.06)'}`,
                        color: deckTypeFilter === f.id ? f.color : '#475569',
                        boxShadow: deckTypeFilter === f.id ? `0 0 12px ${f.bg}` : 'none',
                        transition:'all 0.2s',
                      }}
                    >
                      {f.label}
                      {f.count > 0 && <span style={{ background:'rgba(255,255,255,0.08)', borderRadius:99, padding:'0 5px', fontSize:8, color:'inherit' }}>{f.count}</span>}
                    </button>
                  ))}
                </div>

                {/* Cards grid */}
                <div className="custom-scroll" style={{ flex:1, overflowY:'auto', padding:'16px 24px 24px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12, alignContent:'start' }}>
                  {filtered.length === 0 && (
                    <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:'40px', opacity:0.2 }}>
                      <Search style={{ width:32, height:32, color:'#475569' }} />
                      <p style={{ fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.2em' }}>Nenhuma habilidade encontrada</p>
                    </div>
                  )}
                  {filtered.map((card: any) => {
                    const cfg = typeConfig[card.type] || typeConfig['ação'];
                    const ammoCostCard = card.ammoCost || 0;
                    const canAfford = actor.currentAura >= card.auraCost && (ammoCostCard === 0 || (actor.maxAmmo || 0) === 0 || (actor.currentAmmo ?? 0) >= ammoCostCard);
                    const isPinnedDeck = (actor.pinnedCardIds || []).includes(card.id);
                    const pinnedCountDeck = (actor.pinnedCardIds || []).length;

                    return (
                      <div
                        key={card.id}
                        onClick={() => {
                          if (!canAfford) { alert('Aura insuficiente!'); return; }
                          setShowDeckModal(false);
                          initiateCardUsage(card);
                        }}
                        style={{
                          borderRadius:14,
                          background: cfg.bg,
                          border:`1.5px solid ${isPinnedDeck ? 'rgba(251,191,36,0.7)' : canAfford ? cfg.border : 'rgba(255,255,255,0.04)'}`,
                          display:'flex', flexDirection:'column', overflow:'hidden',
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          filter: canAfford ? 'none' : 'grayscale(0.8) opacity(0.35)',
                          transition:'all 0.2s',
                          boxShadow: isPinnedDeck
                            ? `0 4px 16px rgba(0,0,0,0.7), 0 0 16px rgba(251,191,36,0.25)`
                            : canAfford ? `0 4px 16px rgba(0,0,0,0.7), 0 0 12px ${cfg.border}20` : '0 2px 8px rgba(0,0,0,0.5)',
                          position:'relative',
                        }}
                        onMouseEnter={e => { if (canAfford) { (e.currentTarget as HTMLDivElement).style.transform='translateY(-4px) scale(1.02)'; (e.currentTarget as HTMLDivElement).style.boxShadow=`0 12px 40px rgba(0,0,0,0.8), 0 0 24px ${cfg.border}50`; }}}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform='none'; (e.currentTarget as HTMLDivElement).style.boxShadow = isPinnedDeck ? `0 4px 16px rgba(0,0,0,0.7), 0 0 16px rgba(251,191,36,0.25)` : canAfford ? `0 4px 16px rgba(0,0,0,0.7), 0 0 12px ${cfg.border}20` : '0 2px 8px rgba(0,0,0,0.5)'; }}
                      >
                        {/* Top color bar */}
                        {isPinnedDeck && <div style={{ height:2.5, background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.9),rgba(255,255,255,0.5),rgba(251,191,36,0.9),transparent)', flexShrink:0 }} />}
                        {!isPinnedDeck && canAfford && <div style={{ height:2.5, background:`linear-gradient(90deg,transparent,${cfg.topColor},rgba(255,255,255,0.5),${cfg.topColor},transparent)`, flexShrink:0 }} />}
                        
                        {/* Image */}
                        <div style={{ width:'100%', paddingBottom:'55%', position:'relative', overflow:'hidden', flexShrink:0 }}>
                          <img src={card.image||null} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                          <div style={{ position:'absolute', inset:0, background:`linear-gradient(0deg,rgba(0,0,0,0.7),transparent 50%)` }} />
                          <div style={{ position:'absolute', top:6, left:6, fontSize:7, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:cfg.topColor, padding:'2px 6px', borderRadius:4, background:`${cfg.topColor}22`, border:`1px solid ${cfg.border}55` }}>{cfg.label}</div>
                          {/* Pin badge no canto da imagem */}
                          {isPinnedDeck && (
                            <div style={{ position:'absolute', bottom:5, left:5, background:'rgba(251,191,36,0.25)', border:'1px solid rgba(251,191,36,0.5)', borderRadius:5, padding:'2px 5px', display:'flex', alignItems:'center', gap:3 }}>
                              <Pin style={{ width:7, height:7, color:'#fbbf24' }} />
                              <span style={{ fontSize:7, fontWeight:700, color:'#fbbf24', textTransform:'uppercase', letterSpacing:'0.1em' }}>Fixado</span>
                            </div>
                          )}
                          <div style={{ position:'absolute', top:6, right:6, display:'flex', flexDirection:'column', gap:2, alignItems:'flex-end' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:2, fontSize:9, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:canAfford?'#67e8f9':'#f87171', background:'rgba(0,0,0,0.7)', borderRadius:5, padding:'1px 5px', border:`1px solid ${canAfford?'rgba(103,232,249,0.2)':'rgba(248,113,113,0.2)'}` }}>
                              ⚡{card.auraCost}
                            </div>
                            {ammoCostCard > 0 && <div style={{ fontSize:8, fontWeight:700, color:'#f97316', background:'rgba(0,0,0,0.6)', borderRadius:5, padding:'1px 5px' }}>🎯{ammoCostCard}</div>}
                          </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding:'8px 10px 8px', flex:1 }}>
                          <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', fontStyle:'italic', color:canAfford?'#fff':'#334155', lineHeight:1.2, marginBottom:3, letterSpacing:'0.02em' }}>{card.name}</p>
                          <p style={{ fontSize:8, color:'rgba(255,255,255,0.25)', fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>{card.diceRoll}{card.damage > 0 ? ` · ${card.damage}dmg` : ''}{card.dc ? ` · CD${card.dc}` : ''}</p>
                          {card.description && (
                            <p style={{ fontSize:8, color:'rgba(255,255,255,0.28)', lineHeight:1.4, fontStyle:'italic', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{card.description}</p>
                          )}
                          {card.conditionEffect && (
                            <div style={{ marginTop:5, fontSize:8, color:'#f59e0b', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:5, padding:'2px 6px', display:'inline-flex', alignItems:'center', gap:4 }}>
                              ✦ {card.conditionEffect}
                            </div>
                          )}
                        </div>


                      </div>
                    );
                  })}
                </div>

                {/* Footer stats */}
                <div style={{ padding:'8px 24px', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', gap:16, alignItems:'center', flexShrink:0, background:'rgba(22,27,38,0.95)' }}>
                  <span style={{ fontSize:9, color:'var(--text-faint)', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.15em' }}>
                    {filtered.length} de {allActorCards.length} habilidades
                  </span>
                  {deckSearchTerm && (
                    <button onClick={() => setDeckSearchTerm('')} style={{ fontSize:9, color:'#c9983a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                      <X style={{width:9,height:9}}/> Limpar busca
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

        {/* Aba Personagens */}
        {activeTab === 'characters' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500" style={{ height:'100%', overflowY:'auto' }}>
            {/* ... (Existing characters logic omitted for brevity as it is unchanged) ... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-4xl font-black text-white uppercase italic">Personagens</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Gerencie seus receptáculos</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHideNpcs(v => !v)}
                  className={`flex items-center gap-2 px-5 py-4 rounded-2xl font-extrabold uppercase tracking-widest transition-all active:scale-95 border ${showHideNpcs ? 'bg-slate-800 border-slate-600 text-slate-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-400'}`}
                  title={showHideNpcs ? 'Mostrar NPCs' : 'Ocultar NPCs'}
                >
                  <EyeOff className="w-4 h-4" />
                  <span className="text-xs">NPC</span>
                </button>
                <button 
                  onClick={() => setEditingCharacter({} as any)} 
                  className="flex items-center gap-3 px-8 py-4 bg-amber-600 hover:bg-amber-500 rounded-2xl text-white font-extrabold uppercase tracking-widest shadow-lg shadow-amber-900/40 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" /> Novo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
              {/* Cast Section */}
              {filteredCharacters.filter(c => (c.role ?? 'npc') === 'cast').length > 0 && (
                <>
                  <div className="col-span-full flex items-center gap-4 mt-2">
                    <div className="h-px flex-1 bg-amber-900/30" />
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-500/70 flex items-center gap-2"><Star className="w-3 h-3" /> Cast ({filteredCharacters.filter(c => (c.role ?? 'npc') === 'cast').length})</span>
                    <div className="h-px flex-1 bg-amber-900/30" />
                  </div>
                  {filteredCharacters.filter(c => (c.role ?? 'npc') === 'cast').map((char, idx) => (
                    <CharacterCard key={char.id} char={char} idx={idx} isCharInCombat={isCharInCombat} setEditingCharacter={setEditingCharacter} deleteCharacter={deleteCharacter} setSetupCombatant={setSetupCombatant} />
                  ))}
                </>
              )}
              {/* NPC Section */}
              {filteredCharacters.filter(c => (c.role ?? 'npc') === 'npc').length > 0 && (
                <>
                  <div className="col-span-full flex items-center gap-4 mt-4">
                    <div className="h-px flex-1 bg-slate-800/60" />
                    <button
                      onClick={() => setShowHideNpcs(v => !v)}
                      className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500/70 flex items-center gap-2 hover:text-slate-400 transition-colors"
                    >
                      {showHideNpcs ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <Users className="w-3 h-3" /> NPC ({filteredCharacters.filter(c => (c.role ?? 'npc') === 'npc').length})
                      <span className="ml-1 opacity-50">{showHideNpcs ? '(ocultos)' : ''}</span>
                    </button>
                    <div className="h-px flex-1 bg-slate-800/60" />
                  </div>
                  {!showHideNpcs && filteredCharacters.filter(c => (c.role ?? 'npc') === 'npc').map((char, idx) => (
                    <CharacterCard key={char.id} char={char} idx={idx} isCharInCombat={isCharInCombat} setEditingCharacter={setEditingCharacter} deleteCharacter={deleteCharacter} setSetupCombatant={setSetupCombatant} />
                  ))}
                </>
              )}
              {filteredCharacters.length === 0 && (
                <div className="col-span-full py-24 flex flex-col items-center justify-center gap-6 rounded-[3rem] anim-fade" style={{ border: '2px dashed rgba(180,140,40,0.15)' }}>
                  <div className="p-6 rounded-3xl" style={{ background: 'rgba(180,140,40,0.07)' }}>
                    <Users className="w-14 h-14 text-amber-900" />
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold uppercase tracking-widest text-slate-600 text-sm">Nenhum personagem registrado</p>
                    <p className="text-xs text-slate-700 mt-1">Clique em "Novo" para criar o primeiro</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba Habilidades */}
        {activeTab === 'cards' && (
          <div className="space-y-8 anim-fade-up" style={{ height:'100%', overflowY:'auto' }}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 anim-fade-up">
                <div>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tight">Grimório</h2>
                  <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-xs mt-1">Biblioteca de Habilidades</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto anim-fade-up-d1">
                  <div className="relative flex-1 md:flex-none">
                    <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Buscar..." 
                      className="w-full md:w-64 bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-5 py-3 text-sm text-white focus:border-amber-600 outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => setEditingCard({} as any)} 
                    className="flex items-center gap-2 px-7 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-white font-extrabold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(201,152,58,0.35)] border border-amber-400/30"
                  >
                    <Plus className="w-4 h-4" /> Nova
                  </button>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar snap-x anim-fade-up-d1">
                 <button
                    onClick={() => setCardTypeFilter('all')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-[10px] font-extrabold uppercase tracking-widest snap-start whitespace-nowrap ${cardTypeFilter === 'all' ? 'bg-amber-600 text-white border-amber-400/50 shadow-[0_0_15px_rgba(201,152,58,0.4)]' : 'bg-slate-900/70 text-slate-500 border-white/5 hover:text-slate-300 hover:bg-slate-800'}`}
                 >
                    <Layers className="w-3.5 h-3.5" /> Todos
                 </button>
                 {(['ataque', 'reação', 'ação', 'reforço', 'vínculo', 'combinação', 'forma'] as CardType[]).map(type => {
                    const colors = getCardColors(type);
                    const isActive = cardTypeFilter === type;
                    return (
                       <button
                          key={type}
                          onClick={() => setCardTypeFilter(type)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-[10px] font-extrabold uppercase tracking-widest snap-start whitespace-nowrap ${isActive ? `${colors.iconBg} text-white border-white/20 shadow-md` : 'bg-slate-900/70 text-slate-500 border-white/5 hover:bg-slate-800 hover:text-slate-300'}`}
                       >
                          {type === 'ataque' && <Swords className="w-3.5 h-3.5" />}
                          {type === 'reação' && <Shield className="w-3.5 h-3.5" />}
                          {type === 'ação' && <Zap className="w-3.5 h-3.5" />}
                          {type === 'reforço' && <Heart className="w-3.5 h-3.5" />}
                          {type === 'vínculo' && <LinkIcon className="w-3.5 h-3.5" />}
                          {type === 'combinação' && <Users className="w-3.5 h-3.5" />}
                          {type === 'forma' && <Star className="w-3.5 h-3.5" />}
                          {type}
                       </button>
                    );
                 })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
              {filteredCards.map((card, idx) => {
                const colors = getCardColors(card.type);
                const typeClass = `card-${card.type.replace('ã','a').replace('ç','c').replace('í','i')}`;
                return (
                  <div
                    key={card.id}
                    className={`group relative border rounded-[2.5rem] overflow-hidden ${colors.border} ${typeClass} anim-fade-up`}
                    style={{ animationDelay: `${idx * 40}ms`, background: "#1c1810" }}
                  >
                    {/* Type color tint */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-15 pointer-events-none transition-opacity duration-300 group-hover:opacity-30`} />
                    {/* Top edge glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px opacity-60 pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, currentColor, transparent)` }} />

                    <div className="relative p-6 flex flex-col h-full">
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`px-3 py-1 rounded-full ${colors.badge} text-white text-[10px] font-extrabold uppercase tracking-wider border border-white/10 shadow-md`}
                            style={card.type === 'forma' && card.formaColor ? { background: card.formaColor + '99', borderColor: card.formaColor + '66' } : {}}>
                            {card.type === 'combinação' ? '🔗 ' : card.type === 'forma' ? '✦ ' : ''}{card.type}
                          </div>
                          {card.levels && card.levels.length > 0 && (
                            <div className="px-2 py-1 rounded-full bg-amber-700/40 border border-amber-600/40 text-amber-300 text-[9px] font-extrabold uppercase tracking-widest">
                              {card.levels.length + 1} níveis
                            </div>
                          )}
                          {card.type === 'combinação' && (
                            <div className="px-2 py-1 rounded-full bg-purple-900/50 border border-purple-700/40 text-purple-300 text-[9px] font-extrabold">
                              {card.comboFixedUsers ? `${card.comboMinUsers ?? 2}👥` : `${card.comboMinUsers ?? 2}+👥`}
                            </div>
                          )}
                          {card.bonuses && card.bonuses.length > 0 && (
                            <div className="px-2 py-1 rounded-full bg-emerald-900/50 border border-emerald-700/40 text-emerald-300 text-[9px] font-extrabold">
                              🎁 {card.bonuses.length}
                            </div>
                          )}
                          {card.type === 'forma' && card.formaColor && (
                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: card.formaColor }} title="Cor da forma" />
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button onClick={() => setEditingCard(card)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteCard(card.id)} className="p-2 text-slate-400 hover:text-white hover:bg-rose-600/30 rounded-xl">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setAssignCardModal(card)} className="p-2 text-slate-400 hover:text-white hover:bg-emerald-600/30 rounded-xl" title="Atribuir a Personagem">
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="relative flex-shrink-0">
                            <img src={card.image || undefined} className={`w-16 h-16 rounded-2xl object-cover border-2 ${colors.border} shadow-xl group-hover:scale-105 transition-transform duration-300`} />
                            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity ${colors.bg}`} />
                          </div>
                          <div>
                            <h3 className={`text-xl font-extrabold uppercase italic leading-none ${colors.text}`}>{card.name}</h3>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-white/5">
                                <Dices className="w-3 h-3" /> {card.diceRoll}
                              </span>
                              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 bg-cyan-950/30 px-2 py-1 rounded-lg border border-cyan-900/30">
                                <Zap className="w-3 h-3" /> {card.auraCost}
                              </span>
                              {card.type === 'combinação' && (
                                <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1 bg-purple-950/30 px-2 py-1 rounded-lg border border-purple-900/30">
                                  {(card.comboDiceMode ?? 'sum') === 'sum' ? '➕soma' : '🏆maior'}
                                </span>
                              )}
                              {card.code && (
                                <span className="text-[10px] font-mono text-amber-500/80 flex items-center gap-1 bg-amber-950/30 px-2 py-1 rounded-lg border border-amber-900/30">
                                  <Hash className="w-3 h-3" /> {card.code}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 bg-black/30 p-4 rounded-2xl border border-white/4 italic">
                          {card.description || "Sem descrição."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredCards.length === 0 && (
                <div className="col-span-full py-24 flex flex-col items-center justify-center gap-6 rounded-[3rem] anim-fade" style={{ border: '2px dashed rgba(180,140,40,0.15)' }}>
                  <div className="p-6 rounded-3xl" style={{ background: 'rgba(180,140,40,0.07)' }}>
                    <Layers className="w-14 h-14 text-amber-900" />
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold uppercase tracking-widest text-slate-600 text-sm">Nenhuma habilidade encontrada</p>
                    <p className="text-xs text-slate-700 mt-1">Tente outro filtro ou crie uma nova</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* ─── ABA SELOS ─── */}
        {activeTab === 'seals' && (
          <div className="space-y-8 anim-fade-up" style={{ height:'100%', overflowY:'auto' }}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 anim-fade-up">
                <div>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tight" style={{ background:'linear-gradient(135deg,#fb923c,#f97316,#ea580c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Selos</h2>
                  <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-xs mt-1">Poderes Arcanos Selados</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto anim-fade-up-d1">
                  <div className="relative flex-1 md:flex-none">
                    <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Buscar por nome, código..." className="w-full md:w-72 bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-5 py-3 text-sm text-white focus:border-orange-600 outline-none"
                      value={sealSearchTerm} onChange={e => setSealSearchTerm(e.target.value)} />
                  </div>
                  <button onClick={() => setEditingSeal({} as Seal)}
                    className="flex items-center gap-2 px-7 py-3 rounded-xl text-white font-extrabold uppercase tracking-widest text-xs border"
                    style={{ background:'linear-gradient(135deg,rgba(234,88,12,0.8),rgba(249,115,22,0.7))', border:'1px solid rgba(234,88,12,0.5)', boxShadow:'0 0 20px rgba(234,88,12,0.3)' }}>
                    <Plus className="w-4 h-4" /> Novo Selo
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
              {filteredSeals.map((seal, idx) => (
                <div key={seal.id}
                  className="group relative border rounded-[2.5rem] overflow-hidden card-seal anim-fade-up"
                  style={{
                    background:'linear-gradient(145deg,rgba(20,10,5,0.95),rgba(30,15,5,0.9))',
                    border:'1.5px solid rgba(234,88,12,0.35)',
                    animationDelay: `${idx * 0.04}s`,
                  }}>
                  {/* Top accent */}
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,rgba(234,88,12,0.8),rgba(251,191,36,0.6),rgba(234,88,12,0.8),transparent)' }} />
                  {/* BG glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background:'radial-gradient(ellipse at 50% 0%,rgba(234,88,12,0.08),transparent 65%)' }} />

                  <div className="relative p-6 flex flex-col gap-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          {seal.image ? (
                            <img src={seal.image} className="w-16 h-16 rounded-2xl object-cover border-2 group-hover:scale-105 transition-transform duration-300"
                              style={{ borderColor:'rgba(234,88,12,0.5)' }} />
                          ) : seal.symbol && !seal.symbol.startsWith('http') && !seal.symbol.startsWith('data:') ? (
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                              style={{ background:'rgba(234,88,12,0.1)', border:'2px solid rgba(234,88,12,0.3)' }}>{seal.symbol}</div>
                          ) : (
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                              style={{ background:'rgba(234,88,12,0.1)', border:'2px solid rgba(234,88,12,0.3)' }}>🔯</div>
                          )}
                          {/* Rune ring on hover */}
                          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                            style={{ border:'2px solid rgba(234,88,12,0.6)', animation:'seal-orb-pulse 2s ease-in-out infinite' }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-extrabold uppercase italic leading-none text-white truncate">{seal.name}</h3>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] font-mono px-2 py-1 rounded-lg font-extrabold tracking-widest"
                              style={{ background:'rgba(234,88,12,0.15)', border:'1px solid rgba(234,88,12,0.4)', color:'#fb923c' }}>
                              #{seal.code}
                            </span>
                            {seal.executionModes && seal.executionModes.filter(m => m !== 'immediate').map(m => (
                              <span key={m} className="text-[10px] font-mono px-2 py-1 rounded-lg"
                                style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc' }}>
                                {m === 'preparation' ? `⏳ ${seal.preparationRounds}rds` : `🤝 ${seal.comboMinUsers ?? 2}+`}
                              </span>
                            ))}
                            {(!seal.executionModes || seal.executionModes.length === 0) && seal.executionMode && seal.executionMode !== 'immediate' && (
                              <span className="text-[10px] font-mono px-2 py-1 rounded-lg"
                                style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc' }}>
                                {seal.executionMode === 'preparation' ? `⏳ ${seal.preparationRounds}rds` : `🤝 ${seal.comboMinUsers ?? 2}+`}
                              </span>
                            )}
                            {seal.diceRoll && (
                              <span className="text-[10px] font-mono px-2 py-1 rounded-lg" style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.06)', color:'#94a3b8' }}>
                                🎲 {seal.diceRoll}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                        <button onClick={() => setEditingSeal(seal)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteSeal(seal.id)} className="p-2 text-slate-400 hover:text-white hover:bg-rose-600/30 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 italic" style={{ background:'rgba(0,0,0,0.3)', borderRadius:12, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.04)' }}>
                      {seal.description || 'Sem descrição.'}
                    </p>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-2">
                      {(seal.damage ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171' }}>
                          ⚔ {seal.damage}
                        </div>
                      )}
                      {(seal.healHp ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', color:'#4ade80' }}>
                          💚 +{seal.healHp}HP
                        </div>
                      )}
                      {(seal.healAura ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:'rgba(6,182,212,0.1)', border:'1px solid rgba(6,182,212,0.2)', color:'#67e8f9' }}>
                          ⚡ +{seal.healAura}AU
                        </div>
                      )}
                      {seal.conditionEffect && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', color:'#fbbf24' }}>
                          ✦ {seal.conditionEffect}
                        </div>
                      )}
                      {seal.damageModTarget && seal.damageModTarget !== 'none' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.2)', color:'#c4b5fd' }}>
                          {(seal.damageModValue ?? 0) >= 0 ? '+' : ''}{seal.damageModValue ?? ''}{seal.damageModPercent ? `${seal.damageModPercent}%` : ''} dano
                        </div>
                      )}
                      {seal.requirements && seal.requirements.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', color:'#a5b4fc' }}>
                          🔒 {seal.requirements.length} req.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredSeals.length === 0 && (
                <div className="col-span-full py-24 flex flex-col items-center justify-center gap-6 rounded-[3rem] anim-fade" style={{ border:'2px dashed rgba(234,88,12,0.15)' }}>
                  <div className="p-6 rounded-3xl text-5xl" style={{ background:'rgba(234,88,12,0.07)' }}>🔯</div>
                  <div className="text-center">
                    <p className="font-extrabold uppercase tracking-widest text-slate-600 text-sm">Nenhum selo encontrado</p>
                    <p className="text-xs text-slate-700 mt-1">Crie seu primeiro selo arcano</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba Extras (omitted as mostly unchanged) */}
        {activeTab === 'extras' && (
          <div className="space-y-6 anim-fade-up max-w-6xl mx-auto" style={{ height:'100%', overflowY:'auto' }}>
            {/* Tab Bar */}
            <div className="bg-slate-900/70 border border-white/5 p-1.5 rounded-2xl flex flex-wrap gap-1 w-fit mx-auto shadow-xl">
              {([
                { id: 'dice',     icon: <Dices className="w-4 h-4" />,    label: 'Dados' },
                { id: 'timer',    icon: <Hourglass className="w-4 h-4" />, label: 'Timer' },
                { id: 'progress', icon: <BarChart3 className="w-4 h-4" />, label: 'Progresso' },
                { id: 'names',    icon: <BookOpen className="w-4 h-4" />,  label: 'Nomes' },
                { id: 'loot',     icon: <Package2 className="w-4 h-4" />,  label: 'Saque' },
                { id: 'notes',    icon: <ScrollText className="w-4 h-4" />, label: 'Notas GM' },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setExtrasTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold uppercase text-xs tracking-widest transition-all ${extrasTab === tab.id ? 'text-black shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800/80'}`}
                  style={extrasTab === tab.id ? { background:'linear-gradient(135deg,#fff 0%,#e2e8f0 100%)' } : {}}
                >{tab.icon}{tab.label}</button>
              ))}
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] shadow-2xl border border-slate-800/50 min-h-[420px]">

              {/* ── DADOS ── */}
              {extrasTab === 'dice' && (
                <div className="space-y-8">
                  <div className="flex flex-wrap items-end gap-6 justify-between">
                    <h3 className="text-3xl font-black text-white uppercase italic">Rolagem de Dados</h3>
                    {/* Qty + Bonus controls */}
                    <div className="flex items-center gap-4 bg-slate-900 rounded-2xl px-6 py-3 border border-slate-800">
                      <div className="flex flex-col items-center gap-1">
                        <label className="text-[9px] font-extrabold uppercase text-slate-500">Qtd</label>
                        <div className="flex items-center gap-1">
                          <button onClick={()=>setDiceQty(q=>Math.max(1,q-1))} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black flex items-center justify-center text-sm">−</button>
                          <span className="w-8 text-center font-black text-white text-lg">{diceQty}</span>
                          <button onClick={()=>setDiceQty(q=>Math.min(20,q+1))} className="w-7 h-7 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-black flex items-center justify-center text-sm">+</button>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-slate-700" />
                      <div className="flex flex-col items-center gap-1">
                        <label className="text-[9px] font-extrabold uppercase text-slate-500">Bônus</label>
                        <div className="flex items-center gap-1">
                          <button onClick={()=>setDiceBonus(b=>b-1)} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black flex items-center justify-center text-sm">−</button>
                          <span className={`w-10 text-center font-black text-lg ${diceBonus>0?'text-emerald-400':diceBonus<0?'text-rose-400':'text-slate-400'}`}>{diceBonus>0?`+${diceBonus}`:diceBonus}</span>
                          <button onClick={()=>setDiceBonus(b=>b+1)} className="w-7 h-7 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-black flex items-center justify-center text-sm">+</button>
                        </div>
                      </div>
                      {(diceQty!==1||diceBonus!==0) && <button onClick={()=>{setDiceQty(1);setDiceBonus(0);}} className="text-[9px] text-slate-500 hover:text-rose-400 font-extrabold uppercase ml-2">Reset</button>}
                    </div>
                  </div>

                  {/* Standard dice */}
                  <div className="flex flex-wrap justify-center gap-4">
                    {[4,6,8,10,12,20,100].map(sides => (
                      <button key={sides}
                        onClick={() => handleMultiRoll(sides, diceQty, diceBonus, `${diceQty}D${sides}${diceBonus?`${diceBonus>0?'+':''}${diceBonus}`:''}`)}
                        className="w-24 h-24 bg-slate-900/80 border-2 border-slate-800 hover:border-amber-500 hover:bg-amber-950/30 rounded-[2rem] flex flex-col items-center justify-center gap-1.5 transition-all group shadow-lg hover:-translate-y-2 active:translate-y-0"
                      >
                        {sides===4 && <Triangle className="w-7 h-7 text-slate-600 group-hover:text-amber-400 transition-colors" />}
                        {sides===6 && <Square className="w-7 h-7 text-slate-600 group-hover:text-amber-400 transition-colors" />}
                        {sides===8 && <Octagon className="w-7 h-7 text-slate-600 group-hover:text-amber-400 transition-colors" />}
                        {(sides===10||sides===12) && <Hexagon className="w-7 h-7 text-slate-600 group-hover:text-amber-400 transition-colors" />}
                        {(sides===20||sides===100) && <Circle className="w-7 h-7 text-slate-600 group-hover:text-amber-400 transition-colors" />}
                        <span className="text-xs font-black text-slate-400 group-hover:text-white">D{sides}</span>
                        {diceQty>1 && <span className="text-[9px] font-black text-amber-600">{diceQty}×</span>}
                      </button>
                    ))}
                  </div>

                  {/* Custom dice */}
                  <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center gap-5">
                    <span className="text-xs font-extrabold uppercase text-slate-400 tracking-widest flex-shrink-0">Dado Customizado</span>
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-slate-500 font-black text-sm">{diceQty}d</span>
                      <input type="number" min={2} max={999} value={customDiceSides}
                        onChange={e=>setCustomDiceSides(Math.max(2,Math.min(999,Number(e.target.value))))}
                        className="w-20 bg-slate-900/80 border border-slate-700 rounded-xl py-2 px-3 text-center font-black text-lg text-white outline-none focus:border-amber-500"
                      />
                      {diceBonus!==0 && <span className={`font-black text-sm ${diceBonus>0?'text-emerald-400':'text-rose-400'}`}>{diceBonus>0?'+':''}{diceBonus}</span>}
                    </div>
                    <button
                      onClick={()=>handleMultiRoll(customDiceSides,diceQty,diceBonus,`${diceQty}d${customDiceSides}`)}
                      className="px-6 py-3 bg-amber-700 hover:bg-amber-600 rounded-xl text-white font-extrabold uppercase text-xs transition-all flex items-center gap-2"
                    >
                      <Dices className="w-4 h-4"/> Rolar
                    </button>
                  </div>

                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      {label:'Ataque', notation:'1d20', s:20, q:1, b:0},
                      {label:'Dano ×2', notation:'2d6', s:6, q:2, b:0},
                      {label:'Iniciativa', notation:'1d20+2', s:20, q:1, b:2},
                      {label:'Salvaguarda', notation:'1d20', s:20, q:1, b:0},
                      {label:'3d6 Stats', notation:'3d6', s:6, q:3, b:0},
                      {label:'Percentual', notation:'1d100', s:100, q:1, b:0},
                    ].map(p=>(
                      <button key={p.label} onClick={()=>handleMultiRoll(p.s,p.q,p.b,p.label)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-600/40 rounded-xl text-xs font-black text-slate-400 hover:text-white transition-all flex items-center gap-1.5"
                      ><Trophy className="w-3 h-3"/>{p.label} <span className="text-slate-600">{p.notation}</span></button>
                    ))}
                  </div>

                  {/* Multi-roll result display */}
                  {multiRollResults.length > 1 && (
                    <div className="bg-black/30 rounded-2xl p-4 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">Dados individuais</span>
                        <span className="font-mono font-black text-white text-lg">Total: {multiRollResults.reduce((a,b)=>a+b,0)+diceBonus}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {multiRollResults.map((r,i)=>(
                          <span key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${r===1?'bg-rose-950 border-rose-700 text-rose-400':r===customDiceSides||r===20?'bg-amber-950 border-amber-600 text-amber-300':'bg-slate-900 border-slate-700 text-white'}`}>{r}</span>
                        ))}
                        {diceBonus!==0 && <span className={`px-3 h-10 rounded-xl flex items-center font-black text-sm border ${diceBonus>0?'bg-emerald-950 border-emerald-700 text-emerald-300':'bg-rose-950 border-rose-700 text-rose-300'}`}>{diceBonus>0?'+':''}{diceBonus}</span>}
                      </div>
                    </div>
                  )}

                  {/* History */}
                  <div className="bg-black/20 rounded-[2rem] p-5 max-h-52 overflow-y-auto custom-scroll border border-slate-800/50">
                    <div className="flex items-center justify-between mb-3 sticky top-0">
                      <p className="text-[10px] font-extrabold uppercase text-slate-500">Histórico</p>
                      {rollHistory.length>0 && <button onClick={()=>setRollHistory([])} className="text-[9px] font-extrabold uppercase text-slate-600 hover:text-rose-400">Limpar</button>}
                    </div>
                    <div className="space-y-2">
                      {rollHistory.slice(0,20).map(roll => (
                        <div key={roll.id} className="flex justify-between items-center bg-slate-900/50 px-4 py-2.5 rounded-xl border border-slate-800/50">
                          <span className="text-xs font-bold text-slate-400 uppercase">{roll.type}</span>
                          <span className="text-xl font-black text-white">{roll.result}</span>
                          <span className="text-[10px] font-mono text-slate-600">{new Date(roll.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                      {rollHistory.length===0 && <p className="text-slate-600 text-xs py-6 text-center">Nenhuma rolagem ainda.</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TIMER ── */}
              {extrasTab === 'timer' && (
                <div className="flex flex-col items-center justify-center space-y-10 py-4">
                  <div className="relative">
                    <div className={`w-64 h-64 rounded-full border-8 flex items-center justify-center ${isTimerRunning?'border-amber-500 shadow-[0_0_60px_rgba(212,168,83,0.3)]':'border-slate-800'}`}>
                      <span className="text-5xl font-black font-mono text-white tracking-wider tabular-nums">{formatTime(timerTime)}</span>
                    </div>
                    {isTimerRunning && <div className="absolute inset-0 rounded-full border-8 border-amber-400/20 animate-ping" />}
                  </div>
                  <div className="flex items-end gap-4">
                    {[{label:'Horas',key:'h'},{label:'Min',key:'m'},{label:'Seg',key:'s'}].map(f=>(
                      <div key={f.key} className="flex flex-col gap-2">
                        <label className="text-[9px] font-extrabold uppercase text-slate-500 text-center">{f.label}</label>
                        <input type="number" value={(timerInput as any)[f.key]} onChange={e=>setTimerInput({...timerInput,[f.key]:Number(e.target.value)})} className="w-20 bg-slate-900/80 border border-slate-800 rounded-2xl py-4 text-center font-black text-xl text-white outline-none focus:border-amber-500" />
                      </div>
                    ))}
                  </div>
                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[{l:'30s',v:30},{l:'1min',v:60},{l:'5min',v:300},{l:'10min',v:600},{l:'30min',v:1800},{l:'1h',v:3600}].map(p=>(
                      <button key={p.l} onClick={()=>{setTimerTime(p.v);setIsTimerRunning(false);}} className="px-4 py-2 bg-slate-900 hover:bg-amber-900/30 border border-slate-800 hover:border-amber-600/40 rounded-xl text-xs font-black text-slate-400 hover:text-white transition-all">{p.l}</button>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={setTimerFromInput} className="px-7 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-extrabold uppercase text-xs text-white transition-all">Definir</button>
                    <button onClick={()=>setIsTimerRunning(v=>!v)} className={`px-7 py-4 rounded-2xl font-extrabold uppercase text-xs text-white transition-all flex items-center gap-3 ${isTimerRunning?'bg-amber-600 hover:bg-amber-500':'bg-emerald-600 hover:bg-emerald-500'}`}>
                      {isTimerRunning?<><Pause className="w-4 h-4"/>Pausar</>:<><Play className="w-4 h-4"/>Iniciar</>}
                    </button>
                    <button onClick={()=>{setIsTimerRunning(false);setTimerTime(0);}} className="px-7 py-4 bg-rose-950 hover:bg-rose-900 rounded-2xl font-extrabold uppercase text-xs text-rose-500 transition-all border border-rose-900/30">Zerar</button>
                  </div>
                </div>
              )}

              {/* ── PROGRESSO ── */}
              {extrasTab === 'progress' && (
                <div className="space-y-6 max-w-2xl mx-auto py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-white uppercase italic">Barras de Progresso</h3>
                    <button onClick={()=>setProgressBars(pb=>[...pb,{id:Math.random().toString(36).substr(2,6),label:'Nova Meta',current:0,max:100,color:'#d97706'}])}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-700/40 hover:bg-amber-700/60 border border-amber-700/50 rounded-xl font-black text-xs text-amber-300 transition-all">
                      <Plus className="w-3 h-3"/> Adicionar
                    </button>
                  </div>
                  <div className="space-y-5">
                    {progressBars.map((bar, idx)=>(
                      <div key={bar.id} className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-3">
                        <div className="flex gap-3 items-center">
                          <input type="text" value={bar.label} onChange={e=>setProgressBars(pb=>pb.map((b,i)=>i===idx?{...b,label:e.target.value}:b))}
                            className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 text-sm font-black text-white outline-none focus:border-amber-500" />
                          <input type="color" value={bar.color} onChange={e=>setProgressBars(pb=>pb.map((b,i)=>i===idx?{...b,color:e.target.value}:b))} className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent" />
                          {progressBars.length>1 && <button onClick={()=>setProgressBars(pb=>pb.filter((_,i)=>i!==idx))} className="text-slate-600 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4"/></button>}
                        </div>
                        <div className="h-6 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800 relative">
                          <div className="h-full rounded-full transition-all duration-500" style={{width:`${Math.min(100,(bar.current/bar.max)*100)}%`,background:`linear-gradient(90deg,${bar.color}99,${bar.color})`}} />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white/80">{bar.current}/{bar.max} ({Math.round((bar.current/bar.max)*100)}%)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={()=>setProgressBars(pb=>pb.map((b,i)=>i===idx?{...b,current:Math.max(0,b.current-1)}:b))} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-black flex items-center justify-center">−</button>
                          <input type="number" value={bar.current} onChange={e=>setProgressBars(pb=>pb.map((b,i)=>i===idx?{...b,current:Math.max(0,Math.min(b.max,Number(e.target.value)))}:b))}
                            className="w-20 bg-slate-900/80 border border-slate-800 rounded-xl py-2 text-center font-black text-lg text-white outline-none" />
                          <button onClick={()=>setProgressBars(pb=>pb.map((b,i)=>i===idx?{...b,current:Math.min(b.max,b.current+1)}:b))} className="w-8 h-8 rounded-lg text-white font-black flex items-center justify-center" style={{background:bar.color}}>+</button>
                          <span className="text-slate-500 font-black text-sm">/</span>
                          <input type="number" value={bar.max} onChange={e=>setProgressBars(pb=>pb.map((b,i)=>i===idx?{...b,max:Math.max(1,Number(e.target.value))}:b))}
                            className="w-20 bg-slate-900/80 border border-slate-800 rounded-xl py-2 text-center font-black text-sm text-slate-400 outline-none" />
                          <button onClick={()=>setProgressBars(pb=>pb.map((b,i)=>i===idx?{...b,current:b.max}:b))} className="ml-auto text-[9px] font-extrabold uppercase text-slate-600 hover:text-emerald-400">Max</button>
                          <button onClick={()=>setProgressBars(pb=>pb.map((b,i)=>i===idx?{...b,current:0}:b))} className="text-[9px] font-extrabold uppercase text-slate-600 hover:text-rose-400">Zerar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── NOMES ── */}
              {extrasTab === 'names' && (
                <div className="space-y-8 max-w-2xl mx-auto py-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-3xl font-black text-white uppercase italic">Gerador de Nomes</h3>
                    <p className="text-slate-500 text-sm">NPCs, locais, organizações e mais</p>
                  </div>
                  {/* Style selector */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {([{id:'fantasy',label:'Fantasia'},{id:'nordic',label:'Nórdico'},{id:'arabic',label:'Árabe'},{id:'japanese',label:'Japonês'},{id:'latin',label:'Latino'}] as const).map(s=>(
                      <button key={s.id} onClick={()=>setNameStyle(s.id)} className={`px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${nameStyle===s.id?'bg-amber-700 text-white border-transparent':'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>{s.label}</button>
                    ))}
                  </div>
                  <div className="flex justify-center gap-4">
                    <button onClick={()=>generateNames(nameStyle,8)} className="px-8 py-4 bg-amber-700 hover:bg-amber-600 rounded-2xl font-extrabold uppercase text-sm text-white transition-all flex items-center gap-3 shadow-lg shadow-amber-900/40">
                      <RefreshCw className="w-5 h-5"/> Gerar Nomes
                    </button>
                    <button onClick={()=>generateNames(nameStyle,16)} className="px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-extrabold uppercase text-xs text-slate-300 transition-all">
                      ×2
                    </button>
                  </div>
                  {generatedNames.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {generatedNames.map((name,i)=>(
                        <button key={i} onClick={()=>navigator.clipboard?.writeText(name)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-600/40 rounded-xl py-3 px-4 text-center font-black text-white text-sm transition-all group"
                          title="Clique para copiar">
                          {name}<span className="block text-[9px] text-slate-600 group-hover:text-amber-500 uppercase font-black mt-0.5">copiar</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {generatedNames.length === 0 && (
                    <div className="flex items-center justify-center py-12 opacity-30">
                      <div className="text-center"><BookOpen className="w-12 h-12 mx-auto mb-3" /><p className="font-extrabold uppercase text-sm">Clique em Gerar Nomes</p></div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SAQUE ── */}
              {extrasTab === 'loot' && (
                <div className="space-y-8 max-w-2xl mx-auto py-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-3xl font-black text-white uppercase italic">Gerador de Saque</h3>
                    <p className="text-slate-500 text-sm">Itens aleatórios por tier de raridade</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {([
                      {tier:'common',   label:'Comum',   color:'#94a3b8', glow:'rgba(148,163,184,0.3)'},
                      {tier:'uncommon', label:'Incomum', color:'#4ade80', glow:'rgba(74,222,128,0.3)'},
                      {tier:'rare',     label:'Raro',    color:'#60a5fa', glow:'rgba(96,165,250,0.3)'},
                      {tier:'legendary',label:'Lendário',color:'#f59e0b', glow:'rgba(245,158,11,0.3)'},
                    ] as const).map(t=>(
                      <button key={t.tier} onClick={()=>generateLoot(t.tier,3)}
                        className="p-5 rounded-2xl border-2 text-center flex flex-col items-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0"
                        style={{background:`${t.glow.replace('0.3','0.08')}`,borderColor:`${t.color}55`,boxShadow:`0 0 20px ${t.glow.replace('0.3','0')}`}}
                        onMouseEnter={e=>(e.currentTarget.style.boxShadow=`0 0 20px ${t.glow}`)}
                        onMouseLeave={e=>(e.currentTarget.style.boxShadow=`0 0 20px ${t.glow.replace('0.3','0')}`)}>
                        <Package2 style={{color:t.color,width:24,height:24}}/>
                        <span className="font-black text-sm uppercase" style={{color:t.color}}>{t.label}</span>
                        <span className="text-[9px] text-slate-500 font-extrabold uppercase">3 itens</span>
                      </button>
                    ))}
                  </div>
                  {lootList.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-extrabold uppercase text-slate-500">Itens Gerados</p>
                        <button onClick={()=>setLootList([])} className="text-[9px] font-extrabold uppercase text-slate-600 hover:text-rose-400">Limpar</button>
                      </div>
                      {lootList.map(item=>{
                        const colors:{[k:string]:string}={common:'#94a3b8',uncommon:'#4ade80',rare:'#60a5fa',legendary:'#f59e0b'};
                        const color=colors[item.rarity]||'#94a3b8';
                        return (
                          <div key={item.id} className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:color,boxShadow:`0 0 6px ${color}`}} />
                            <span className="flex-1 font-bold text-sm text-white">{item.name}</span>
                            <span className="text-[9px] font-extrabold uppercase" style={{color}}>{item.rarity}</span>
                            <button onClick={()=>setLootList(l=>l.filter(i=>i.id!==item.id))} className="text-slate-600 hover:text-rose-400 transition-colors"><X className="w-3 h-3"/></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {lootList.length === 0 && (
                    <div className="flex items-center justify-center py-12 opacity-30">
                      <div className="text-center"><Package2 className="w-12 h-12 mx-auto mb-3"/><p className="font-extrabold uppercase text-sm">Selecione um tier para gerar itens</p></div>
                    </div>
                  )}
                </div>
              )}

              {/* ── NOTAS GM ── */}
              {extrasTab === 'notes' && (
                <div className="space-y-6 py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-white uppercase italic flex items-center gap-3"><ScrollText className="w-6 h-6 text-amber-400"/> Notas do Mestre</h3>
                    <span className="text-[10px] font-extrabold uppercase text-slate-600">Privado · não salvo na nuvem</span>
                  </div>
                  <textarea
                    value={gmNotes}
                    onChange={e=>setGmNotes(e.target.value)}
                    placeholder="Segredos do dungeon, planos de vilões, NPCs importantes, revelações futuras...&#10;&#10;Use este espaço para anotações que só o mestre precisa ver."
                    className="w-full h-72 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-sm text-slate-300 outline-none focus:border-amber-600 resize-none custom-scroll leading-relaxed placeholder-slate-700"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                      <p className="text-[9px] font-extrabold uppercase text-slate-500 mb-2">Rolagem Secreta</p>
                      <p className="text-xs text-slate-400 mb-3">Role dados sem mostrar o resultado para os jogadores</p>
                      <div className="flex gap-2 flex-wrap">
                        {[4,6,8,12,20].map(s=>(
                          <button key={s} onClick={()=>{const r=Math.floor(Math.random()*s)+1;setGmNotes(n=>n+`\n[Rolagem secreta D${s}: ${r}]`);}}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-black text-slate-400 hover:text-white transition-all">D{s}</button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                      <p className="text-[9px] font-extrabold uppercase text-slate-500 mb-2">Ferramentas Rápidas</p>
                      <div className="space-y-2">
                        <button onClick={()=>setGmNotes(n=>n+`\n--- Cena ${new Date().toLocaleTimeString()} ---\n`)} className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-black text-slate-400 hover:text-white text-left transition-all">+ Marcar nova cena</button>
                        <button onClick={()=>setGmNotes(n=>n+`\n⚠ PONTO IMPORTANTE: `)} className="w-full px-3 py-2 bg-amber-950/50 hover:bg-amber-900/40 rounded-xl text-xs font-black text-amber-600 hover:text-amber-400 text-left transition-all">+ Ponto importante</button>
                        <button onClick={()=>setGmNotes('')} className="w-full px-3 py-2 bg-rose-950/50 hover:bg-rose-900/40 rounded-xl text-xs font-black text-rose-600 hover:text-rose-400 text-left transition-all">Limpar tudo</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      {/* ZOOM OVERLAY — carta puxada da mão, flutuando sobre o grid com opções */}
      {zoomedCard && (() => {
        const typeColors: Record<string, { border: string; glow: string; bg: string; label: string; btnBg: string; btnBorder: string; btnColor: string }> = {
          ataque:  { border:'#ef4444', glow:'rgba(239,68,68,0.7)',   bg:'linear-gradient(165deg,rgba(45,15,15,0.99),rgba(55,18,18,0.97))',  label:'ATK', btnBg:'rgba(239,68,68,0.18)', btnBorder:'rgba(239,68,68,0.7)', btnColor:'#fca5a5' },
          ação:    { border:'#eab308', glow:'rgba(234,179,8,0.7)',   bg:'linear-gradient(165deg,rgba(40,30,5,0.99),rgba(60,45,5,0.97))',   label:'AÇÃ', btnBg:'rgba(234,179,8,0.18)', btnBorder:'rgba(234,179,8,0.7)', btnColor:'#fde68a' },
          reação:  { border:'#3b82f6', glow:'rgba(59,130,246,0.7)',  bg:'linear-gradient(165deg,rgba(5,15,40,0.99),rgba(8,22,55,0.97))',   label:'REA', btnBg:'rgba(59,130,246,0.18)', btnBorder:'rgba(59,130,246,0.7)', btnColor:'#93c5fd' },
          reforço: { border:'#22c55e', glow:'rgba(34,197,94,0.7)',   bg:'linear-gradient(165deg,rgba(5,30,12,0.99),rgba(8,45,18,0.97))',   label:'REF', btnBg:'rgba(34,197,94,0.18)', btnBorder:'rgba(34,197,94,0.7)', btnColor:'#86efac' },
          vínculo: { border:'#94a3b8', glow:'rgba(148,163,184,0.7)',  bg:'linear-gradient(165deg,rgba(20,22,28,0.99),rgba(30,32,40,0.97))', label:'VÍN', btnBg:'rgba(148,163,184,0.18)', btnBorder:'rgba(148,163,184,0.7)', btnColor:'#cbd5e1' },
          combinação: { border:'#c084fc', glow:'rgba(192,132,252,0.85)', bg:'linear-gradient(165deg,rgba(40,5,60,0.99),rgba(55,8,80,0.97))', label:'CMB', btnBg:'rgba(192,132,252,0.18)', btnBorder:'rgba(192,132,252,0.8)', btnColor:'#e9d5ff' },
        };
        const cfg = typeColors[zoomedCard.type] || typeColors['ação'];
        const el = (zoomedCard as any).element;
        const elConfig: Record<string, { primary: string; emoji: string }> = {
          fogo:  { primary: '#ef4444', emoji: '🔥' }, água:  { primary: '#3b82f6', emoji: '💧' },
          terra: { primary: '#92400e', emoji: '🪨' }, vento: { primary: '#86efac', emoji: '🍃' },
          raio:  { primary: '#facc15', emoji: '⚡' },
        };
        const elCfg = el ? elConfig[el] : null;
        const activeBorder = elCfg ? elCfg.primary : cfg.border;
        const activeGlow = elCfg ? `${elCfg.primary}99` : cfg.glow;

        return (
          <>
            <style>{`
              @keyframes zoom-card-pull {
                0%   { opacity:0; transform:translateY(120px) scale(0.45) rotate(-14deg); filter:blur(16px); }
                45%  { opacity:1; transform:translateY(-10px) scale(1.06) rotate(2deg); filter:blur(0); }
                65%  { transform:translateY(4px) scale(0.97) rotate(-0.8deg); }
                82%  { transform:translateY(-5px) scale(1.02) rotate(0.4deg); }
                100% { transform:translateY(0) scale(1) rotate(0deg); }
              }
              @keyframes zoom-float {
                0%,100% { transform:translateY(0) rotate(0deg); }
                33%     { transform:translateY(-8px) rotate(0.7deg); }
                66%     { transform:translateY(-3px) rotate(-0.4deg); }
              }
              @keyframes zoom-aura-pulse {
                0%,100% { opacity:0.55; transform:scale(1); }
                50%     { opacity:0.85; transform:scale(1.08); }
              }
              @keyframes zoom-wave {
                0%   { transform:scale(0.3); opacity:0.6; }
                100% { transform:scale(3.5); opacity:0; }
              }
              @keyframes zoom-btn-in {
                0%   { opacity:0; transform:scale(0.5) translateY(12px); }
                70%  { transform:scale(1.07); }
                100% { opacity:1; transform:scale(1) translateY(0); }
              }
              @keyframes zoom-cancel-in {
                from { opacity:0; transform:translateY(-8px); }
                to   { opacity:1; transform:translateY(0); }
              }
              @keyframes zoom-shimmer {
                0%   { background-position:-200% center; }
                100% { background-position:200% center; }
              }
            `}</style>

            {/* Soft darkening behind card only — NOT full blur */}
            <div
              onClick={() => { setZoomedCard(null); setActiveCardItemBoost(null); }}
              style={{
                position:'fixed', inset:0, zIndex:9048,
                background:'rgba(2,4,14,0.6)',
                backdropFilter:'blur(4px)',
              }}
            />

            {/* Cancel button — ALWAYS fixed in corner, above everything */}
            <button
              onClick={e => { e.stopPropagation(); setZoomedCard(null); setActiveCardItemBoost(null); }}
              style={{
                position:'fixed', top:18, right:18, zIndex:9999,
                padding:'10px 18px', borderRadius:14,
                background:'rgba(20,8,8,0.95)',
                border:'1.5px solid rgba(220,38,38,0.7)',
                color:'#f87171', fontSize:11, fontWeight:900,
                textTransform:'uppercase', letterSpacing:'0.3em',
                cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                backdropFilter:'blur(12px)',
                boxShadow:'0 0 24px rgba(220,38,38,0.3)',
                animation:'zoom-cancel-in 0.3s 0.1s both',
                pointerEvents:'auto',
              }}
            >
              <X style={{ width:13, height:13 }} />
              Cancelar
            </button>

            {/* ── CARD ZOOM: 3-column layout (stats | card | actions) ── */}
            <div style={{
              position:'fixed', inset:0, zIndex:9050,
              display:'flex', alignItems:'center', justifyContent:'center',
              pointerEvents:'none',
            }}>

              {/* Ambient waves */}
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{
                    position:'absolute', width:280+i*30, height:280+i*30, borderRadius:'50%',
                    border:`1.5px solid ${activeBorder}${i===1?'55':i===2?'33':'18'}`,
                    animation:`zoom-wave 2.2s ${(i-1)*0.45}s ease-out infinite`,
                  }} />
                ))}
              </div>

              {/* Wide aura glow */}
              <div style={{
                position:'absolute', width:800, height:480, borderRadius:40,
                background:`radial-gradient(ellipse at 50% 50%, ${activeGlow} 0%, transparent 60%)`,
                filter:'blur(50px)', animation:'zoom-aura-pulse 2s ease-in-out infinite', pointerEvents:'none',
              }} />

              {/* 3-COLUMN ROW */}
              <div style={{
                position:'relative', zIndex:2,
                display:'flex', alignItems:'center', gap:20,
                animation:'zoom-card-pull 0.65s cubic-bezier(0.22,1,0.36,1) both',
                maxWidth:'min(96vw, 820px)',
              }}>

                {/* ── LEFT: Stats Panel ── */}
                <div style={{
                  width:168, flexShrink:0, display:'flex', flexDirection:'column', gap:8,
                  pointerEvents:'auto',
                  animation:'zoom-btn-in 0.45s 0.15s both',
                }}>
                  {/* Type + element */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
                    <span style={{
                      fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.12em',
                      color:activeBorder, padding:'4px 10px', borderRadius:8,
                      background:`${activeBorder}20`, border:`1.5px solid ${activeBorder}66`,
                    }}>{cfg.label}</span>
                    {elCfg && <span style={{ fontSize:14 }}>{elCfg.emoji}</span>}
                    {zoomedCard.isAreaEffect && (
                      <span style={{ fontSize:9, fontWeight:700, color:'#fb923c', background:'rgba(234,88,12,0.18)', border:'1px solid rgba(234,88,12,0.45)', borderRadius:6, padding:'3px 8px', textTransform:'uppercase', letterSpacing:'0.08em' }}>💥 Área</span>
                    )}
                  </div>

                  {/* Aura cost */}
                  <div style={{ background:'rgba(103,232,249,0.07)', border:'1px solid rgba(103,232,249,0.22)', borderRadius:12, padding:'9px 13px' }}>
                    <div style={{ fontSize:8, fontWeight:700, color:'rgba(103,232,249,0.5)', textTransform:'uppercase', letterSpacing:'0.25em', marginBottom:3 }}>Custo Aura</div>
                    <div style={{ fontSize:28, fontWeight:900, color:'#67e8f9', fontFamily:"'JetBrains Mono',monospace", textShadow:'0 0 14px rgba(103,232,249,0.55)', lineHeight:1 }}>⚡ {zoomedCard.auraCost}</div>
                  </div>

                  {/* Dice */}
                  {zoomedCard.diceRoll && (
                    <div style={{ background:`${activeBorder}0d`, border:`1px solid ${activeBorder}30`, borderRadius:12, padding:'8px 13px' }}>
                      <div style={{ fontSize:8, fontWeight:700, color:`${activeBorder}77`, textTransform:'uppercase', letterSpacing:'0.25em', marginBottom:3 }}>Rolagem</div>
                      <div style={{ fontSize:22, fontWeight:900, color:'rgba(255,255,255,0.85)', fontFamily:"'JetBrains Mono',monospace" }}>{zoomedCard.diceRoll}</div>
                    </div>
                  )}

                  {/* Damage */}
                  {(zoomedCard.damage ?? 0) > 0 && (
                    <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.28)', borderRadius:12, padding:'8px 13px' }}>
                      <div style={{ fontSize:8, fontWeight:700, color:'rgba(239,68,68,0.5)', textTransform:'uppercase', letterSpacing:'0.25em', marginBottom:3 }}>Dano</div>
                      <div style={{ fontSize:26, fontWeight:900, color:'#f87171', fontFamily:"'JetBrains Mono',monospace", textShadow:'0 0 12px rgba(239,68,68,0.5)' }}>⚔ {zoomedCard.damage}</div>
                      {(zoomedCard as any).damageType && (zoomedCard as any).damageType !== 'normal' && (() => {
                        const dt = DAMAGE_TYPES.find(d => d.value === (zoomedCard as any).damageType);
                        return dt ? <div style={{ fontSize:9, color:dt.color, fontWeight:700, marginTop:3 }}>{dt.emoji} {dt.label}</div> : null;
                      })()}
                    </div>
                  )}

                  {/* DC */}
                  {(zoomedCard.dc ?? 0) > 0 && (
                    <div style={{ background:'rgba(234,179,8,0.07)', border:'1px solid rgba(234,179,8,0.28)', borderRadius:12, padding:'8px 13px' }}>
                      <div style={{ fontSize:8, fontWeight:700, color:'rgba(234,179,8,0.5)', textTransform:'uppercase', letterSpacing:'0.25em', marginBottom:3 }}>CD</div>
                      <div style={{ fontSize:24, fontWeight:900, color:'#e8c878', fontFamily:"'JetBrains Mono',monospace" }}>{zoomedCard.dc}</div>
                    </div>
                  )}

                  {/* Condition */}
                  {zoomedCard.conditionEffect && (
                    <div style={{ background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.28)', borderRadius:12, padding:'8px 13px' }}>
                      <div style={{ fontSize:8, fontWeight:700, color:'rgba(245,158,11,0.5)', textTransform:'uppercase', letterSpacing:'0.25em', marginBottom:3 }}>Condição</div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#f59e0b' }}>✦ {zoomedCard.conditionEffect} <span style={{ fontSize:9, color:'rgba(245,158,11,0.55)', fontWeight:600 }}>({zoomedCard.conditionDuration ?? 3} rod.)</span></div>
                      {/* Condition per-round effects */}
                      {zoomedCard.conditionEffects?.[zoomedCard.conditionEffect] && (
                        <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:3 }}>
                          {zoomedCard.conditionEffects[zoomedCard.conditionEffect].map((eff, i) => {
                            const meta: Record<string, {emoji:string; color:string}> = {
                              damage:{emoji:'🩸',color:'#f87171'}, heal:{emoji:'💚',color:'#4ade80'},
                              drainAura:{emoji:'🔥',color:'#fbbf24'}, recoverAura:{emoji:'⚡',color:'#a78bfa'},
                              drainAmmo:{emoji:'🎯',color:'#f97316'}, recoverAmmo:{emoji:'🔄',color:'#67e8f9'},
                              dicePenalty:{emoji:'📉',color:'#fb923c'}, diceBonus:{emoji:'📈',color:'#86efac'},
                            };
                            const m = meta[eff.type] ?? {emoji:'?',color:'#94a3b8'};
                            return (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                                <span style={{ fontSize:10 }}>{m.emoji}</span>
                                <span style={{ fontSize:9, fontWeight:700, color:m.color }}>
                                  {eff.diceRoll ? `${eff.diceRoll}${eff.value ? ` +${eff.value}` : ''}` : eff.value}
                                  {' '}por rodada
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Combo info */}
                  {zoomedCard.type === 'combinação' && (
                    <div style={{ background:'rgba(192,132,252,0.07)', border:'1px solid rgba(192,132,252,0.28)', borderRadius:12, padding:'8px 13px' }}>
                      <div style={{ fontSize:8, fontWeight:700, color:'rgba(192,132,252,0.5)', textTransform:'uppercase', letterSpacing:'0.25em', marginBottom:4 }}>Combinação</div>
                      <div style={{ fontSize:10, fontWeight:700, color:'#d8b4fe' }}>
                        {zoomedCard.comboFixedUsers
                          ? `${zoomedCard.comboMinUsers ?? 2} jogadores exatos`
                          : `${zoomedCard.comboMinUsers ?? 2}${zoomedCard.comboMaxUsers ? '–' + zoomedCard.comboMaxUsers : '+'} jogadores`}
                      </div>
                      <div style={{ fontSize:9, color:'rgba(216,180,254,0.6)', marginTop:3 }}>
                        {(zoomedCard.comboDiceMode ?? 'sum') === 'sum' ? '➕ Soma os dados' : '🏆 Maior dado'}
                      </div>
                    </div>
                  )}

                  {/* Forma info */}
                  {zoomedCard.type === 'forma' && (
                    <div style={{ background:`${zoomedCard.formaColor || '#f59e0b'}11`, border:`1px solid ${zoomedCard.formaColor || '#f59e0b'}44`, borderRadius:12, padding:'8px 13px' }}>
                      <div style={{ fontSize:8, fontWeight:700, color:`${zoomedCard.formaColor || '#f59e0b'}88`, textTransform:'uppercase', letterSpacing:'0.25em', marginBottom:4 }}>✦ Forma</div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {zoomedCard.formaIcon && <img src={zoomedCard.formaIcon} style={{ width:28, height:28, borderRadius:'50%', border:`2px solid ${zoomedCard.formaColor || '#f59e0b'}66` }} />}
                        <div style={{ fontSize:9, color:`${zoomedCard.formaColor || '#f59e0b'}cc` }}>
                          {zoomedCard.formaCardIds?.length ? `${zoomedCard.formaCardIds.length} cartas desbloqueadas` : 'Sem cartas extras'}
                        </div>
                      </div>
                      {/* Active forma indicator */}
                      {combat?.activeForms?.find(f => f.cardId === zoomedCard.id && f.combatantId === currentActor?.combatId) && (
                        <div style={{ fontSize:8, fontWeight:700, color:'#4ade80', marginTop:4 }}>● FORMA ATIVA — clique para desativar</div>
                      )}
                    </div>
                  )}

                  {/* Bonus info */}
                  {zoomedCard.bonuses && zoomedCard.bonuses.length > 0 && (
                    <div style={{ background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.28)', borderRadius:12, padding:'8px 13px' }}>
                      <div style={{ fontSize:8, fontWeight:700, color:'rgba(34,197,94,0.5)', textTransform:'uppercase', letterSpacing:'0.25em', marginBottom:5 }}>🎁 Bônus ao Ativar</div>
                      {zoomedCard.bonuses.map((b, i) => (
                        <div key={i} style={{ fontSize:9, fontWeight:700, color:'#4ade80', marginBottom:2 }}>
                          {b.label || `${BONUS_TYPE_LABELS[b.type] || b.type}: +${b.value}`}
                          {b.duration ? ` (${b.duration}r)` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── CENTER: Card floating ── */}
                <div style={{
                  animation:'zoom-float 3.5s 0.7s ease-in-out infinite',
                  flexShrink:0, position:'relative', zIndex:2, pointerEvents:'auto',
                }}>
                  <div style={{
                    width:256, borderRadius:20,
                    background:cfg.bg,
                    border:`2.5px solid ${activeBorder}`,
                    boxShadow:`0 0 60px ${activeGlow}, 0 0 120px ${activeGlow}44, 0 40px 80px rgba(0,0,0,0.97)`,
                    display:'flex', flexDirection:'column', overflow:'hidden', position:'relative',
                    flexShrink:0,
                  }}>
                    {/* Shimmer top bar */}
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
                      background:`linear-gradient(90deg,transparent,${activeBorder},rgba(255,255,255,0.9),${activeBorder},transparent)`,
                      backgroundSize:'200% 100%', animation:'zoom-shimmer 2s linear infinite', zIndex:3 }} />
                    {/* Header */}
                    <div style={{ padding:'10px 14px 8px', background:`${activeBorder}18`, borderBottom:`1px solid ${activeBorder}44`,
                      display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em',
                          color:activeBorder, padding:'2px 8px', borderRadius:5, background:`${activeBorder}18`, border:`1px solid ${activeBorder}55` }}>{cfg.label}</span>
                        {elCfg && <span>{elCfg.emoji}</span>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontFamily:"'JetBrains Mono',monospace",
                        fontSize:11, fontWeight:900, color:'#67e8f9', background:'rgba(0,0,0,0.5)',
                        borderRadius:6, padding:'2px 7px', border:'1px solid rgba(103,232,249,0.22)' }}>
                        ⚡{zoomedCard.auraCost}
                      </div>
                    </div>
                    {/* Image */}
                    <div style={{ height:190, overflow:'hidden', position:'relative', flexShrink:0 }}>
                      {zoomedCard.image
                        ? <img src={zoomedCard.image} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                        : <div style={{ width:'100%', height:'100%', background:`radial-gradient(ellipse at 50% 40%,${activeBorder}22,rgba(0,0,0,0.85))` }} />
                      }
                      <div style={{ position:'absolute', inset:0, background:`linear-gradient(0deg,rgba(0,0,0,0.82),transparent 55%)` }} />
                    </div>
                    {/* Name */}
                    <div style={{ padding:'14px 14px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                      <p style={{ fontSize:16, fontWeight:900, textTransform:'uppercase', fontStyle:'italic',
                        color:'#fff', letterSpacing:'0.04em', textShadow:`0 0 20px ${activeBorder}`, textAlign:'center', lineHeight:1.1 }}>{zoomedCard.name}</p>
                      {zoomedCard.isAreaEffect && (
                        <span style={{ fontSize:9, fontWeight:700, color:'#fb923c', background:'rgba(234,88,12,0.2)', border:'1px solid rgba(234,88,12,0.4)', borderRadius:4, padding:'1px 7px', textTransform:'uppercase', letterSpacing:'0.1em' }}>💥 Efeito em Área</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── RIGHT: Description + Action Buttons ── */}
                <div style={{
                  width:168, flexShrink:0, display:'flex', flexDirection:'column', gap:10,
                  pointerEvents:'auto',
                  animation:'zoom-btn-in 0.45s 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
                }}>

                  {/* Description */}
                  {zoomedCard.description && (
                    <div style={{ background:`${activeBorder}0a`, border:`1px solid ${activeBorder}26`, borderRadius:12, padding:'10px 13px', marginBottom:2 }}>
                      <div style={{ fontSize:8, fontWeight:700, color:`${activeBorder}66`, textTransform:'uppercase', letterSpacing:'0.25em', marginBottom:5 }}>Descrição</div>
                      <p style={{ fontSize:11, color:'rgba(255,255,255,0.62)', lineHeight:1.6, fontStyle:'italic' }}>
                        {zoomedCardLevel > 1 && zoomedCard.levels && zoomedCard.levels[zoomedCardLevel-2]?.description
                          ? zoomedCard.levels[zoomedCardLevel-2].description
                          : zoomedCard.description}
                      </p>
                    </div>
                  )}

                  {/* Level selector if card has levels */}
                  {zoomedCard.levels && zoomedCard.levels.length > 0 && (
                    <div style={{ background:'rgba(201,152,58,0.07)', border:'1px solid rgba(201,152,58,0.25)', borderRadius:12, padding:'9px 13px' }}>
                      <div style={{ fontSize:8, fontWeight:700, color:'rgba(201,152,58,0.55)', textTransform:'uppercase', letterSpacing:'0.25em', marginBottom:6 }}>Nível</div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {[1, ...(zoomedCard.levels.map((_,i) => i+2))].map(lv => (
                          <button
                            key={lv}
                            onClick={e => { e.stopPropagation(); setZoomedCardLevel(lv); }}
                            style={{
                              padding:'4px 10px', borderRadius:8, fontSize:10, fontWeight:900,
                              cursor:'pointer', transition:'all 0.2s',
                              background: zoomedCardLevel === lv ? 'rgba(201,152,58,0.4)' : 'rgba(0,0,0,0.4)',
                              border: `1px solid ${zoomedCardLevel === lv ? 'rgba(201,152,58,0.8)' : 'rgba(255,255,255,0.1)'}`,
                              color: zoomedCardLevel === lv ? '#fcd34d' : '#475569',
                              boxShadow: zoomedCardLevel === lv ? '0 0 12px rgba(201,152,58,0.4)' : 'none',
                            }}
                          >
                            Nv {lv}
                          </button>
                        ))}
                      </div>
                      {zoomedCardLevel > 1 && zoomedCard.levels[zoomedCardLevel-2] && (() => {
                        const lv = zoomedCard.levels[zoomedCardLevel-2];
                        return (
                          <div style={{ marginTop:6, display:'flex', gap:6, flexWrap:'wrap' }}>
                            {lv.diceRoll && <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:'rgba(255,255,255,0.6)', background:'rgba(0,0,0,0.4)', borderRadius:5, padding:'2px 6px' }}>🎲 {lv.diceRoll}</span>}
                            {lv.auraCost !== undefined && <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:'#67e8f9', background:'rgba(0,0,0,0.4)', borderRadius:5, padding:'2px 6px' }}>⚡ {lv.auraCost}</span>}
                            {lv.damage !== undefined && lv.damage > 0 && <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:'#f87171', background:'rgba(0,0,0,0.4)', borderRadius:5, padding:'2px 6px' }}>⚔ {lv.damage}</span>}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Use on target */}
                  <button
                    onClick={e => { e.stopPropagation(); confirmCardUsage(zoomedCard, zoomedCardLevel); }}
                    style={{
                      padding:'12px 14px', borderRadius:13, width:'100%',
                      background:`linear-gradient(135deg, ${activeBorder}38, ${activeBorder}18)`,
                      border:`1.5px solid ${activeBorder}`,
                      color:cfg.btnColor, fontSize:11, fontWeight:900,
                      textTransform:'uppercase', letterSpacing:'0.12em',
                      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      boxShadow:`0 0 20px ${activeGlow}50`,
                    }}
                  >
                    <Target style={{ width:13, height:13 }} />
                    {zoomedCard.type === 'combinação' ? '🔗 Convocar' : zoomedCard.type === 'forma' ? '✦ Ativar Forma' : zoomedCard.isAreaEffect ? 'Sel. Alvos' : 'Usar no Alvo'}
                  </button>

                  {/* Auto-target — hidden for combo and forma cards */}
                  {zoomedCard.type !== 'combinação' && zoomedCard.type !== 'forma' && (
                  <button
                    onClick={e => { e.stopPropagation(); setZoomedCard(null); executeCardOnTarget(zoomedCard, 'self'); }}
                    style={{
                      padding:'12px 14px', borderRadius:13, width:'100%',
                      background:'rgba(18,22,34,0.95)',
                      border:'1.5px solid rgba(212,168,83,0.5)',
                      color:'#d4a853', fontSize:11, fontWeight:900,
                      textTransform:'uppercase', letterSpacing:'0.12em',
                      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      boxShadow:'0 0 14px rgba(212,168,83,0.2)',
                    }}
                  >
                    <Swords style={{ width:13, height:13 }} />
                    Auto-Alvo
                  </button>
                  )}

                  {/* Area all — hidden for combo and forma cards */}
                  {zoomedCard.type !== 'combinação' && zoomedCard.type !== 'forma' && (
                  <button
                    onClick={e => { e.stopPropagation(); setZoomedCard(null); executeCardOnTarget(zoomedCard, 'area'); }}
                    style={{
                      padding:'12px 14px', borderRadius:13, width:'100%',
                      background:'linear-gradient(135deg,rgba(170,130,35,0.25),rgba(110,80,15,0.4))',
                      border:'1.5px solid rgba(212,168,83,0.6)',
                      color:'#fdf0cc', fontSize:11, fontWeight:900,
                      textTransform:'uppercase', letterSpacing:'0.12em',
                      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      boxShadow:'0 0 20px rgba(212,168,83,0.25)',
                    }}
                  >
                    <Layers style={{ width:13, height:13 }} />
                    Área Total
                  </button>
                  )}

                  {/* Label */}
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.4em', color:`${activeBorder}66`, textTransform:'uppercase', textAlign:'center', marginTop:2 }}>
                    ◆ escolha como usar ◆
                  </div>

                  {/* Item boosts: par/trinca/quadra/reroll from actor inventory */}
                  {currentActor && (() => {
                    const actorChar = characters.find(c => c.id === currentActor.id);
                    const boostItems = ['Par','Trinca','Quadra','Reroll'].filter(name => {
                      const item = actorChar?.items.find(it => it.name === name && it.category === 'Upgrade' && (it.quantity ?? 0) > 0);
                      return !!item;
                    });
                    if (boostItems.length === 0) return null;
                    const boostKey = activeCardItemBoost?.charId === currentActor.id ? activeCardItemBoost.itemName : null;
                    return (
                      <div style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.25)', borderRadius:12, padding:'10px 12px' }}>
                        <div style={{ fontSize:8, fontWeight:700, color:'rgba(251,191,36,0.5)', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:6 }}>🎴 Usar Item</div>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                          {boostItems.map(name => {
                            const lname = name.toLowerCase() as 'par'|'trinca'|'quadra'|'reroll';
                            const isActive = boostKey === lname;
                            const item = actorChar?.items.find(it => it.name === name && it.category === 'Upgrade');
                            return (
                              <button key={name}
                                onClick={e => { e.stopPropagation(); setActiveCardItemBoost(isActive ? null : { charId: currentActor.id, itemName: lname }); }}
                                style={{ padding:'4px 10px', borderRadius:8, fontSize:9, fontWeight:700, cursor:'pointer', transition:'all 0.15s',
                                  background: isActive ? 'rgba(251,191,36,0.35)' : 'rgba(0,0,0,0.4)',
                                  border: `1px solid ${isActive ? 'rgba(251,191,36,0.8)' : 'rgba(255,255,255,0.12)'}`,
                                  color: isActive ? '#fcd34d' : '#94a3b8',
                                }}>
                                {name === 'Par' ? '✌ Par' : name === 'Trinca' ? '🔱 Trinca' : name === 'Quadra' ? '♦ Quadra' : '🎲 Reroll'}
                                {' '}×{item?.quantity ?? 0}
                              </button>
                            );
                          })}
                        </div>
                        {boostKey && (
                          <p style={{ fontSize:8, color:'rgba(251,191,36,0.6)', marginTop:5, lineHeight:1.4 }}>
                            {boostKey === 'par' ? '✌ Rolará 2 dados, usa o melhor' : boostKey === 'trinca' ? '🔱 Rolará 3 dados, usa o melhor' : boostKey === 'quadra' ? '♦ Rolará 4 dados, usa o melhor' : '🎲 Em falha, relança o dado'}
                            {' — '}item será consumido ao usar
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Queimar button — available for all non-forma cards */}
                  {zoomedCard.type !== 'forma' && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setZoomedCard(null);
                        setBurningCard(zoomedCard);
                        setBurnStep('targets');
                        setBurnTargets([]);
                        setBurnEffect('damage');
                        setBurnFixedValue(1);
                        setBurnDiceResult(null);
                        setBurnFinalValue(null);
                        setBurnActorCombatId(currentActor?.combatId || selectedCombatantId || null);
                      }}
                      style={{
                        padding:'10px 14px', borderRadius:13, width:'100%',
                        background:'linear-gradient(135deg,rgba(220,38,38,0.25),rgba(120,10,10,0.4))',
                        border:'1.5px solid rgba(220,38,38,0.7)',
                        color:'#fca5a5', fontSize:11, fontWeight:900,
                        textTransform:'uppercase', letterSpacing:'0.12em',
                        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                        boxShadow:'0 0 18px rgba(220,38,38,0.3)',
                        marginTop:4,
                      }}
                    >
                      <Flame style={{ width:13, height:13 }} />
                      🔥 Queimar Carta
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      })()}

      <style>{`
        @keyframes el-card-hover-pulse { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
        @keyframes cardHoverFloat {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          35%     { transform: translateY(-7px) rotate(0.35deg); }
          65%     { transform: translateY(-4px) rotate(-0.2deg); }
        }
        @keyframes cardShimmerSweep {
          0%   { opacity:0; transform: translateX(-110%) skewX(-20deg); }
          40%  { opacity:0.22; }
          100% { opacity:0; transform: translateX(280%) skewX(-20deg); }
        }
        @keyframes seal-orb-pulse {
          0%,100% { box-shadow: 0 0 10px rgba(234,88,12,0.45), inset 0 0 6px rgba(234,88,12,0.15); }
          50%     { box-shadow: 0 0 28px rgba(234,88,12,0.9), inset 0 0 14px rgba(234,88,12,0.35); }
        }
        @keyframes sealRuneSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* ── BURN CARD MODAL (QUEIMAR) ──────────────────────── */}
      {burningCard && combat && createPortal(
        <div style={{ position:'fixed', inset:0, zIndex:99000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(4,0,0,0.88)', backdropFilter:'blur(18px)' }}>
          <style>{`
            @keyframes burn-destroy {
              0%   { opacity:1; transform:scale(1) rotate(0deg); filter:brightness(1); }
              20%  { opacity:1; transform:scale(1.12) rotate(-3deg); filter:brightness(3) saturate(2); }
              50%  { opacity:0.7; transform:scale(0.6) rotate(12deg); filter:brightness(5) saturate(3) hue-rotate(30deg); }
              75%  { opacity:0.3; transform:scale(0.2) rotate(25deg) translateY(-40px); filter:brightness(8) blur(4px); }
              100% { opacity:0; transform:scale(0) rotate(40deg) translateY(-80px); filter:brightness(10) blur(12px); }
            }
            @keyframes burn-ember {
              0%   { opacity:1; transform:translate(0,0) scale(1); }
              100% { opacity:0; transform:translate(var(--ex,20px), var(--ey,-60px)) scale(0.2); }
            }
            @keyframes burn-glow-in {
              from { opacity:0; transform:scale(0.8); }
              to   { opacity:1; transform:scale(1); }
            }
          `}</style>

          <div style={{ maxWidth:520, width:'90vw', background:'linear-gradient(165deg,rgba(25,5,5,0.99),rgba(40,10,10,0.97))', border:'2px solid rgba(220,38,38,0.7)', borderRadius:28, padding:28, display:'flex', flexDirection:'column', gap:18, position:'relative', overflow:'hidden', animation:'burn-glow-in 0.3s ease' }}>
            {/* Title */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Flame style={{ width:22, height:22, color:'#f87171' }} />
              <h3 style={{ fontSize:18, fontWeight:900, color:'#fca5a5', textTransform:'uppercase', letterSpacing:'0.12em' }}>🔥 Queimar Carta</h3>
              <div style={{ flex:1 }} />
              <button onClick={() => setBurningCard(null)} style={{ padding:'4px 10px', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#475569', fontSize:10, fontWeight:700, cursor:'pointer' }}>✕ Cancelar</button>
            </div>

            {/* Card being burned */}
            <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(220,38,38,0.07)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:14, padding:'10px 14px', animation: burnStep === 'destroyed' ? 'burn-destroy 1.8s cubic-bezier(0.22,1,0.36,1) forwards' : 'none' }}>
              {burningCard.image && <img src={burningCard.image} style={{ width:44, height:44, borderRadius:8, objectFit:'cover', border:'1.5px solid rgba(220,38,38,0.5)' }} />}
              <div>
                <p style={{ fontSize:13, fontWeight:900, color:'#fca5a5', textTransform:'uppercase', fontStyle:'italic' }}>{burningCard.name}</p>
                <p style={{ fontSize:9, color:'#7f1d1d', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.15em' }}>🎲 {burningCard.diceRoll}</p>
              </div>
              {burnStep === 'destroyed' && (
                <div style={{ marginLeft:'auto', fontSize:22 }}>💀</div>
              )}
            </div>

            {/* STEP 1: Choose targets */}
            {burnStep === 'targets' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <p style={{ fontSize:11, fontWeight:700, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.15em' }}>1. Escolha os alvos da queima:</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:6, maxHeight:200, overflowY:'auto' }}>
                  {combat.combatants.map(t => {
                    const sel = burnTargets.includes(t.combatId);
                    return (
                      <button key={t.combatId} onClick={() => setBurnTargets(prev => sel ? prev.filter(id => id !== t.combatId) : [...prev, t.combatId])}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 10px', borderRadius:10, border:`1.5px solid ${sel ? 'rgba(220,38,38,0.8)' : 'rgba(255,255,255,0.08)'}`, background: sel ? 'rgba(220,38,38,0.18)' : 'rgba(0,0,0,0.3)', cursor:'pointer', textAlign:'left' }}>
                        {t.icon && <img src={t.icon} style={{ width:24, height:24, borderRadius:5, objectFit:'cover' }} />}
                        <span style={{ fontSize:10, fontWeight:700, color: sel ? '#fca5a5' : '#64748b', textTransform:'uppercase', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</span>
                        {sel && <span style={{ marginLeft:'auto', fontSize:10, color:'#f87171' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                <button disabled={burnTargets.length === 0} onClick={() => setBurnStep('config')}
                  style={{ padding:'11px', borderRadius:12, background: burnTargets.length > 0 ? 'rgba(220,38,38,0.25)' : 'rgba(0,0,0,0.3)', border:`1.5px solid ${burnTargets.length > 0 ? 'rgba(220,38,38,0.6)' : 'rgba(255,255,255,0.05)'}`, color: burnTargets.length > 0 ? '#fca5a5' : '#334155', fontWeight:900, fontSize:12, textTransform:'uppercase', letterSpacing:'0.12em', cursor: burnTargets.length > 0 ? 'pointer' : 'not-allowed' }}>
                  {burnTargets.length > 0 ? `Próximo (${burnTargets.length} alvo${burnTargets.length > 1 ? 's' : ''}) →` : 'Selecione ao menos 1 alvo'}
                </button>
              </div>
            )}

            {/* STEP 2: Configure effect */}
            {burnStep === 'config' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <p style={{ fontSize:11, fontWeight:700, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.15em' }}>2. Configure o efeito da queima:</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {([
                    { key:'damage', label:'⚔ Causar Dano', color:'#f87171', bg:'rgba(220,38,38,0.18)', border:'rgba(220,38,38,0.7)' },
                    { key:'healHp', label:'❤ Curar HP', color:'#86efac', bg:'rgba(34,197,94,0.18)', border:'rgba(34,197,94,0.7)' },
                    { key:'drainAura', label:'⚡ Drenar Aura', color:'#fde68a', bg:'rgba(234,179,8,0.18)', border:'rgba(234,179,8,0.7)' },
                    { key:'gainAura', label:'✦ Ganhar Aura', color:'#c4b5fd', bg:'rgba(168,85,247,0.18)', border:'rgba(168,85,247,0.7)' },
                  ] as const).map(opt => (
                    <button key={opt.key} onClick={() => setBurnEffect(opt.key as any)}
                      style={{ padding:'10px', borderRadius:10, background: burnEffect === opt.key ? opt.bg : 'rgba(0,0,0,0.3)', border:`1.5px solid ${burnEffect === opt.key ? opt.border : 'rgba(255,255,255,0.06)'}`, color: burnEffect === opt.key ? opt.color : '#334155', fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em', cursor:'pointer' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={{ fontSize:10, fontWeight:700, color:'rgba(220,38,38,0.7)', textTransform:'uppercase', letterSpacing:'0.2em' }}>Valor fixo (multiplicador):</label>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <input type="number" min={1} value={burnFixedValue} onChange={e => setBurnFixedValue(Math.max(1, Number(e.target.value)))}
                      style={{ width:80, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(220,38,38,0.5)', borderRadius:8, padding:'8px 12px', color:'#fca5a5', fontWeight:900, fontSize:18, fontFamily:"'JetBrains Mono',monospace", textAlign:'center', outline:'none' }} />
                    <div style={{ flex:1, fontSize:10, color:'#475569', lineHeight:1.5 }}>
                      <p>Fórmula: <span style={{ color:'#fcd34d', fontFamily:"'JetBrains Mono',monospace" }}>dado × nível_evol × {burnFixedValue}</span></p>
                      <p style={{ marginTop:2 }}>Dado: {burningCard.diceRoll}</p>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setBurnStep('targets')} style={{ flex:1, padding:'10px', borderRadius:12, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.08)', color:'#475569', fontWeight:700, fontSize:11, textTransform:'uppercase', cursor:'pointer' }}>← Voltar</button>
                  <button onClick={() => executeBurnCard(burningCard!, burnTargets, burnEffect, burnFixedValue, zoomedCardLevel)}
                    style={{ flex:2, padding:'11px', borderRadius:12, background:'linear-gradient(135deg,rgba(220,38,38,0.4),rgba(120,10,10,0.6))', border:'1.5px solid rgba(220,38,38,0.7)', color:'#fca5a5', fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:'0.12em', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 0 20px rgba(220,38,38,0.35)' }}>
                    <Flame style={{ width:14, height:14 }} /> 🔥 QUEIMAR!
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Rolling animation */}
            {burnStep === 'rolling' && (
              <div style={{ textAlign:'center', padding:'20px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'rgba(220,38,38,0.7)', textTransform:'uppercase', letterSpacing:'0.3em' }}>Rolando {burningCard.diceRoll}...</div>
                {burnDiceResult !== null && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                    <div style={{ fontSize:10, color:'#7f1d1d', textTransform:'uppercase', letterSpacing:'0.2em' }}>Resultado do dado:</div>
                    <div style={{ fontSize:64, fontWeight:900, color:'#f87171', fontFamily:"'JetBrains Mono',monospace", textShadow:'0 0 30px rgba(220,38,38,0.8)', lineHeight:1 }}>{burnDiceResult}</div>
                    <div style={{ fontSize:11, color:'#475569' }}>× nível {zoomedCardLevel} × {burnFixedValue}</div>
                    <div style={{ fontSize:11, color:'rgba(220,38,38,0.6)', marginTop:4 }}>= </div>
                    <div style={{ fontSize:48, fontWeight:900, color:'#ef4444', fontFamily:"'JetBrains Mono',monospace", textShadow:'0 0 40px rgba(239,68,68,1)', lineHeight:1, animation:'burn-glow-in 0.3s 0.5s both', opacity:0 }}>
                      {burnFinalValue}
                    </div>
                    <div style={{ fontSize:10, color:'rgba(248,113,113,0.6)', textTransform:'uppercase', letterSpacing:'0.2em', marginTop:4 }}>
                      {burnEffect === 'damage' ? '⚔ de dano' : burnEffect === 'healHp' ? '❤ de cura' : burnEffect === 'drainAura' ? '⚡ de dreno' : '✦ de aura'}
                    </div>
                  </div>
                )}
                <div style={{ fontSize:11, color:'#7f1d1d', animation:'danger-pulse 0.6s ease-in-out infinite', marginTop:8 }}>🔥 Carta sendo destruída...</div>
              </div>
            )}

            {/* STEP 4: Destroyed */}
            {burnStep === 'destroyed' && (
              <div style={{ textAlign:'center', padding:'14px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:40 }}>💀</div>
                <div style={{ fontSize:16, fontWeight:900, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.2em' }}>Carta Destruída!</div>
                <div style={{ fontSize:11, color:'#475569' }}>{burningCard.name} foi removida permanentemente.</div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── COMBINATION CARD OVERLAY ── */}
      {comboCard && combat && (() => {
        const minUsers = comboCard.comboMinUsers ?? 2;
        const maxUsers = comboCard.comboFixedUsers ? minUsers : (comboCard.comboMaxUsers || 0);
        const diceMode = comboCard.comboDiceMode ?? 'sum';

        // Find all other combatants who have this card AND haven't acted yet
        const eligibleCoParticipants = combat.combatants.filter(c => {
          if (!currentActor || c.combatId === currentActor.combatId) return false;
          if (c.currentHp <= 0) return false;
          if (actedCombatantIds.has(c.combatId)) return false;
          // Check if they have this card
          return c.cardIds && c.cardIds.includes(comboCard.id);
        });

        const canExecute = comboParticipants.length >= minUsers
          && (maxUsers === 0 || comboParticipants.length <= maxUsers)
          && (!comboCard.comboFixedUsers || comboParticipants.length === minUsers);

        return createPortal(
          <div style={{
            position:'fixed', inset:0, zIndex:9900,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(4,2,14,0.92)', backdropFilter:'blur(18px)',
          }}>
            <style>{`
              @keyframes combo-pulse-ring {
                0%   { transform:scale(0.8); opacity:0.7; }
                100% { transform:scale(2.2); opacity:0; }
              }
              @keyframes combo-card-in {
                from { opacity:0; transform:translateY(40px) scale(0.85); }
                to   { opacity:1; transform:translateY(0) scale(1); }
              }
              @keyframes combo-participant-pop {
                0%   { opacity:0; transform:scale(0.5) rotate(-8deg); }
                70%  { transform:scale(1.1) rotate(1deg); }
                100% { opacity:1; transform:scale(1) rotate(0deg); }
              }
              @keyframes combo-glow-orbit {
                0%   { transform:rotate(0deg) translateX(72px) scale(1); }
                50%  { transform:rotate(180deg) translateX(72px) scale(1.1); }
                100% { transform:rotate(360deg) translateX(72px) scale(1); }
              }
            `}</style>

            {/* Ambient purple glow */}
            <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(168,85,247,0.18) 0%,transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }} />
            {[1,2,3].map(i => (
              <div key={i} style={{ position:'absolute', width:220+i*80, height:220+i*80, borderRadius:'50%', border:`1.5px solid rgba(168,85,247,${0.3-i*0.07})`, animation:`combo-pulse-ring 2.5s ${i*0.6}s ease-out infinite`, pointerEvents:'none' }} />
            ))}

            <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', gap:24, maxWidth:520, width:'100%', padding:'0 20px', animation:'combo-card-in 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
              {/* Header */}
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'rgba(192,132,252,0.6)', textTransform:'uppercase', letterSpacing:'0.4em', marginBottom:6 }}>Habilidade de Combinação</div>
                <h2 style={{ fontSize:28, fontWeight:900, color:'#e9d5ff', textTransform:'uppercase', fontStyle:'italic', textShadow:'0 0 30px rgba(168,85,247,0.8)', letterSpacing:'0.05em' }}>🔗 {comboCard.name}</h2>
                <p style={{ fontSize:11, color:'rgba(216,180,254,0.55)', marginTop:6 }}>
                  {comboCard.comboFixedUsers
                    ? `Requer exatamente ${minUsers} jogadores`
                    : `Requer mínimo ${minUsers}${maxUsers ? ` / máximo ${maxUsers}` : ''} jogadores`}
                  {' · '}
                  {diceMode === 'sum' ? '1 dado por jogador (soma)' : '1 dado por jogador (maior)'}
                </p>
              </div>

              {/* Participants display */}
              <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', minHeight:80 }}>
                {comboParticipants.map((cid, idx) => {
                  const c = combat.combatants.find(cb => cb.combatId === cid);
                  if (!c) return null;
                  const isInitiator = currentActor && cid === currentActor.combatId;
                  return (
                    <div key={cid} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, animation:`combo-participant-pop 0.4s ${idx*0.12}s both` }}>
                      <div style={{ position:'relative', width:56, height:56 }}>
                        {c.icon
                          ? <img src={c.icon} style={{ width:56, height:56, borderRadius:16, objectFit:'cover', border:`2.5px solid rgba(168,85,247,0.8)`, boxShadow:'0 0 20px rgba(168,85,247,0.5)' }} />
                          : <div style={{ width:56, height:56, borderRadius:16, background:'rgba(168,85,247,0.2)', border:'2.5px solid rgba(168,85,247,0.8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👤</div>
                        }
                        {isInitiator && <div style={{ position:'absolute', top:-6, left:'50%', transform:'translateX(-50%)', fontSize:9, fontWeight:700, color:'#c084fc', background:'rgba(40,8,60,0.95)', border:'1px solid rgba(168,85,247,0.5)', borderRadius:5, padding:'1px 5px', whiteSpace:'nowrap' }}>Iniciador</div>}
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, color:'#e9d5ff', textAlign:'center', maxWidth:64, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</span>
                      {!isInitiator && (
                        <button
                          onClick={() => setComboParticipants(prev => prev.filter(id => id !== cid))}
                          style={{ fontSize:8, color:'rgba(248,113,113,0.7)', background:'none', border:'1px solid rgba(248,113,113,0.3)', borderRadius:4, padding:'1px 5px', cursor:'pointer', fontWeight:700, textTransform:'uppercase' }}
                        >✕ Remover</button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Eligible co-participants to add */}
              {eligibleCoParticipants.length > 0 ? (
                <div style={{ background:'rgba(168,85,247,0.07)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:16, padding:'14px', width:'100%' }}>
                  <p style={{ fontSize:9, fontWeight:700, color:'rgba(192,132,252,0.6)', textTransform:'uppercase', letterSpacing:'0.3em', marginBottom:10, textAlign:'center' }}>Adicionar Participante</p>
                  <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                    {eligibleCoParticipants.map(c => {
                      const alreadyIn = comboParticipants.includes(c.combatId);
                      const atMax = maxUsers > 0 && comboParticipants.length >= maxUsers;
                      return (
                        <button
                          key={c.combatId}
                          onClick={() => {
                            if (alreadyIn) setComboParticipants(prev => prev.filter(id => id !== c.combatId));
                            else if (!atMax) setComboParticipants(prev => [...prev, c.combatId]);
                          }}
                          disabled={atMax && !alreadyIn}
                          style={{
                            display:'flex', alignItems:'center', gap:7, padding:'7px 12px',
                            borderRadius:12, border:`1.5px solid ${alreadyIn ? 'rgba(168,85,247,0.8)' : 'rgba(168,85,247,0.25)'}`,
                            background: alreadyIn ? 'rgba(168,85,247,0.2)' : 'rgba(0,0,0,0.3)',
                            color: alreadyIn ? '#e9d5ff' : '#6b7280',
                            cursor: (atMax && !alreadyIn) ? 'not-allowed' : 'pointer',
                            fontSize:11, fontWeight:700, transition:'all 0.2s',
                            opacity: (atMax && !alreadyIn) ? 0.4 : 1,
                          }}
                        >
                          {c.icon ? <img src={c.icon} style={{ width:22, height:22, borderRadius:6, objectFit:'cover' }} /> : <span style={{fontSize:16}}>👤</span>}
                          {c.name}
                          {alreadyIn && <span style={{fontSize:10, color:'#c084fc'}}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ background:'rgba(168,85,247,0.06)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:12, padding:'10px 16px', width:'100%', textAlign:'center' }}>
                  <p style={{ fontSize:10, color:'rgba(216,180,254,0.45)', fontWeight:600, fontStyle:'italic' }}>
                    {comboParticipants.length >= minUsers
                      ? 'Nenhum outro participante elegível disponível'
                      : `Nenhum outro personagem com esta habilidade está disponível para agir`}
                  </p>
                </div>
              )}

              {/* Validation message */}
              {!canExecute && (
                <p style={{ fontSize:10, color:'rgba(251,113,133,0.7)', textAlign:'center', fontWeight:600 }}>
                  {comboParticipants.length < minUsers
                    ? `Precisa de pelo menos ${minUsers} participantes (atual: ${comboParticipants.length})`
                    : comboCard.comboFixedUsers && comboParticipants.length !== minUsers
                    ? `Requer exatamente ${minUsers} participantes`
                    : ''}
                </p>
              )}

              {/* Action buttons */}
              <div style={{ display:'flex', gap:10, width:'100%' }}>
                <button
                  onClick={() => { setComboCard(null); setComboParticipants([]); }}
                  style={{ flex:1, padding:'12px', borderRadius:13, background:'rgba(220,38,38,0.1)', border:'1.5px solid rgba(220,38,38,0.3)', color:'#f87171', fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', cursor:'pointer' }}
                >
                  ✕ Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!canExecute) return;
                    // Enter target selection for the combo card
                    setSelectingTargetFor({ ...comboCard, _comboParticipants: comboParticipants } as any);
                    setComboCard(null);
                  }}
                  disabled={!canExecute}
                  style={{
                    flex:2, padding:'12px', borderRadius:13,
                    background: canExecute ? 'linear-gradient(135deg,rgba(168,85,247,0.5),rgba(139,68,219,0.7))' : 'rgba(60,40,80,0.3)',
                    border:`1.5px solid ${canExecute ? 'rgba(168,85,247,0.9)' : 'rgba(168,85,247,0.2)'}`,
                    color: canExecute ? '#e9d5ff' : '#6b7280',
                    fontSize:12, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em',
                    cursor: canExecute ? 'pointer' : 'not-allowed',
                    boxShadow: canExecute ? '0 0 30px rgba(168,85,247,0.4)' : 'none',
                    transition:'all 0.2s',
                  }}
                >
                  🔗 Executar Combinação ({comboParticipants.length}👥)
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
      {selectingTargetFor && createPortal(
        <div style={{
          position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
          zIndex:9995, padding:'14px 20px 18px',
          display:'flex', flexDirection:'column', alignItems:'center', gap:10,
          background:'rgba(4,6,20,0.97)',
          backdropFilter:'blur(20px)',
          borderTop:'1px solid rgba(255,255,255,0.07)',
          borderRadius:'20px 20px 0 0',
          boxShadow:'0 -8px 60px rgba(0,0,0,0.8)',
          minWidth:360, maxWidth:'90vw',
          pointerEvents:'auto',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8,
            background: selectingTargetFor.type === 'combinação' ? 'rgba(168,85,247,0.1)' : 'rgba(220,38,38,0.1)',
            border: `1px solid ${selectingTargetFor.type === 'combinação' ? 'rgba(168,85,247,0.35)' : 'rgba(220,38,38,0.35)'}`,
            borderRadius:10, padding:'5px 14px' }}>
            <Target style={{ width:12, height:12, color: selectingTargetFor.type === 'combinação' ? '#c084fc' : '#f87171' }} />
            <span style={{ fontSize:10, fontWeight:900, color: selectingTargetFor.type === 'combinação' ? '#c084fc' : '#f87171', textTransform:'uppercase', letterSpacing:'0.25em' }}>
              {selectingTargetFor.type === 'combinação' ? '🔗 Alvo da Combinação' : 'Selecionar Alvo'}
            </span>
            <span style={{ fontSize:9, color: selectingTargetFor.type === 'combinação' ? 'rgba(192,132,252,0.5)' : 'rgba(248,113,113,0.5)' }}>— {selectingTargetFor.name}</span>
          </div>
          <p style={{ fontSize:9, color:'rgba(212,168,83,0.55)', textTransform:'uppercase', letterSpacing:'0.25em', textAlign:'center', margin:0 }}>
            {selectingTargetFor.isAreaEffect
              ? 'Clique nos combatentes no grid para selecionar'
              : 'Clique num combatente no grid ou na faixa de turnos'}
          </p>
          {selectingTargetFor.isAreaEffect && areaSelectedTargets.length > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
              {areaSelectedTargets.map(tid => {
                const t = combat?.combatants.find(c => c.combatId === tid);
                return t ? (
                  <div key={tid} style={{ display:'flex', alignItems:'center', gap:4,
                    background:'rgba(234,88,12,0.2)', border:'1px solid rgba(234,88,12,0.5)',
                    borderRadius:6, padding:'3px 8px' }}>
                    {t.icon && <img src={t.icon} style={{ width:14, height:14, borderRadius:3, objectFit:'cover' }} />}
                    <span style={{ fontSize:9, color:'#fb923c', fontWeight:700 }}>{t.name}</span>
                    <button onClick={() => setAreaSelectedTargets(prev => prev.filter(id => id !== tid))}
                      style={{ color:'rgba(251,146,60,0.5)', fontSize:10, background:'none', border:'none', cursor:'pointer', padding:0, lineHeight:1 }}>x</button>
                  </div>
                ) : null;
              })}
            </div>
          )}
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            {selectingTargetFor.isAreaEffect && (
              <button
                onClick={() => executeCardOnTarget(selectingTargetFor, 'area', undefined, areaSelectedTargets.length > 0 ? areaSelectedTargets : undefined)}
                style={{ padding:'11px 24px', borderRadius:14,
                  background:'linear-gradient(135deg,rgba(234,88,12,0.55),rgba(180,60,5,0.75))',
                  border:'1.5px solid rgba(234,88,12,0.7)', color:'#fed7aa',
                  fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.15em',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                  boxShadow:'0 0 22px rgba(234,88,12,0.35)', pointerEvents:'auto' }}>
                {areaSelectedTargets.length > 0 ? 'Executar ('+areaSelectedTargets.length+' alvos)' : 'Executar em Todos'}
              </button>
            )}
            <button
              onClick={() => { const c = selectingTargetFor; setSelectingTargetFor(null); executeCardOnTarget(c, 'self'); }}
              style={{ padding:'11px 22px', borderRadius:14,
                background:'rgba(18,22,38,0.98)', border:'1.5px solid rgba(212,168,83,0.5)',
                color:'#d4a853', fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.15em',
                cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                boxShadow:'0 0 16px rgba(212,168,83,0.2)', pointerEvents:'auto' }}>
              Auto-Alvo
            </button>
            {!selectingTargetFor.isAreaEffect && (
              <button
                onClick={() => { const c = selectingTargetFor; setSelectingTargetFor(null); executeCardOnTarget(c, 'area'); }}
                style={{ padding:'11px 22px', borderRadius:14,
                  background:'linear-gradient(135deg,rgba(180,140,40,0.3),rgba(120,90,20,0.45))',
                  border:'1.5px solid rgba(212,168,83,0.6)', color:'#fdf0cc',
                  fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.15em',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                  boxShadow:'0 0 22px rgba(212,168,83,0.28)', pointerEvents:'auto' }}>
                Area Total
              </button>
            )}
            <button
              onClick={() => { setSelectingTargetFor(null); setAreaSelectedTargets([]); }}
              style={{ padding:'11px 20px', borderRadius:14,
                background:'rgba(20,6,6,0.98)', border:'1.5px solid rgba(220,38,38,0.5)',
                color:'#f87171', fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.15em',
                cursor:'pointer', display:'flex', alignItems:'center', gap:7,
                boxShadow:'0 0 16px rgba(220,38,38,0.2)', pointerEvents:'auto' }}>
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ANIMACAO DE CARTA + DADO */}
      <CardRevealAnimation
        payload={cardAnim}
        onComplete={() => setCardAnim(null)}
      />

      {/* ANIMAÇÃO DE ATIVAÇÃO DE FORMA */}
      {formaAnimCard && (() => {
        const fc = formaAnimCard;
        const color = fc.formaColor || '#f59e0b';
        const colorDim = color + '88';
        const emojis = ['✦','★','◈','❋','✴'];
        return createPortal(
          <div
            style={{ position:'fixed', inset:0, zIndex:99998, pointerEvents:'none',
              background: `radial-gradient(ellipse at center, ${color}44 0%, ${color}22 40%, transparent 70%)`,
              animation: 'forma-flash 1.8s cubic-bezier(0.22,1,0.36,1) forwards',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            {/* Full screen color flash */}
            <div style={{
              position:'absolute', inset:0,
              background: `radial-gradient(ellipse at 50% 50%, ${color}66 0%, ${color}11 60%, transparent 100%)`,
              animation:'forma-flash 1.8s forwards',
            }} />

            {/* Card zoom */}
            <div style={{
              position:'absolute', top:'50%', left:'50%',
              animation:'forma-card-zoom 1.8s cubic-bezier(0.22,1,0.36,1) forwards',
              zIndex:2,
            }}>
              <div style={{
                width:180, height:240,
                borderRadius:20,
                border:`3px solid ${color}`,
                boxShadow:`0 0 60px ${colorDim}, 0 0 120px ${color}33, inset 0 0 40px ${color}22`,
                background:`linear-gradient(165deg, rgba(10,10,15,0.98), rgba(20,15,5,0.97))`,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                overflow:'hidden', position:'relative',
              }}>
                {/* Glow inner ring */}
                <div style={{ position:'absolute', inset:0, borderRadius:18, background:`radial-gradient(ellipse at 50% 30%, ${color}33 0%, transparent 60%)`, animation:'forma-glow-anim 2s infinite' }} />
                {/* Card image or fallback */}
                {fc.image ? (
                  <img src={fc.image} style={{ width:'100%', height:'60%', objectFit:'cover', opacity:0.9 }} />
                ) : (
                  <div style={{ fontSize:64, lineHeight:1, marginBottom:8 }}>✦</div>
                )}
                <div style={{ fontSize:14, fontWeight:900, color, textTransform:'uppercase', letterSpacing:'0.12em', textShadow:`0 0 20px ${color}`, textAlign:'center', padding:'0 12px', marginTop:8 }}>
                  {fc.name}
                </div>
                <div style={{ fontSize:9, fontWeight:700, color:color+'99', textTransform:'uppercase', letterSpacing:'0.3em', marginTop:4 }}>FORMA ATIVADA</div>
              </div>
            </div>

            {/* Orbiting emojis */}
            {emojis.map((em, idx) => (
              <div key={idx} style={{
                position:'absolute', top:'50%', left:'50%',
                fontSize: 18 + idx * 4,
                opacity:0.7,
                '--orbit-r': `${80 + idx * 25}px`,
                '--orbit-dur': `${1.2 + idx * 0.4}s`,
                animation:`el-emoji-orbit var(--orbit-dur) linear infinite`,
                animationDelay: `${idx * 0.2}s`,
              } as React.CSSProperties}>{em}</div>
            ))}
          </div>,
          document.body
        );
      })()}

      {/* SEAL COMBO SELECT MODAL */}
      {sealComboSelectModal && createPortal(
        <SealComboModal
          seal={sealComboSelectModal.seal}
          actor={sealComboSelectModal.actor}
          combatants={combat?.combatants || []}
          onExecute={(participants) => {
            executeSeal(sealComboSelectModal.seal, sealComboSelectModal.actor.combatId, participants);
            setSealComboSelectModal(null);
          }}
          onClose={() => setSealComboSelectModal(null)}
        />,
        document.body
      )}

      {/* NPC WILDCARD MODAL */}
      {npcWildcardModal && createPortal(
        <NpcWildcardModal
          actor={npcWildcardModal.actor}
          command={npcWildcardModal.command}
          cards={cards}
          onCreated={(card) => {
            const newCard = { ...card, id: Math.random().toString(36).substr(2, 9) };
            DatabaseService.saveCard(newCard as any);
            setCards(prev => [...prev, newCard as any]);
            // Attach to NPC character
            const char = characters.find(c => c.id === npcWildcardModal.actor.id);
            if (char) {
              const updatedCardIds = [...(char.cardIds || []), newCard.id];
              updateCharacterStats(char.id, { cardIds: updatedCardIds });
            }
            setNpcWildcardModal(null);
            // Use the card
            initiateCardUsage(newCard as any);
          }}
          onClose={() => setNpcWildcardModal(null)}
        />,
        document.body
      )}

      {/* NPC SPECIAL CARD CONFIG MODAL */}
      {npcSpecialCardModal && createPortal(
        <NpcSpecialCardModal
          actor={npcSpecialCardModal.actor}
          cardType={npcSpecialCardModal.cardType}
          onUse={(card) => {
            setNpcSpecialCardModal(null);
            initiateCardUsage(card as any);
          }}
          onClose={() => setNpcSpecialCardModal(null)}
        />,
        document.body
      )}

      {/* FUSÃO DE CARTAS OVERLAY */}
      {fusionStep && fusionActor && createPortal(
        <FusionOverlay
          step={fusionStep}
          selectedCards={fusionSelectedCards}
          actor={fusionActor}
          rolls={fusionRolls}
          success={fusionSuccess}
          newCard={fusionNewCard}
          revealCard={fusionRevealCard}
          cards={cards}
          onRollComplete={(rolls, success) => {
            setFusionRolls(rolls);
            setFusionSuccess(success);
            if (success) {
              setFusionStep('animating');
            } else {
              // Show failure briefly then close
              setTimeout(() => {
                setFusionStep(null);
                setFusionSelectedCards([]);
                setFusionActor(null);
                setFusionRolls([]);
                setFusionSuccess(false);
              }, 3000);
            }
          }}
          onAnimComplete={() => {
            setFusionStep('creating');
          }}
          onCardCreated={(card) => {
            // Save card and add to character
            const newCard = { ...card, id: Math.random().toString(36).substr(2, 9) };
            DatabaseService.saveCard(newCard);
            setCards(prev => [...prev, newCard]);
            // Add to character's deck
            const char = characters.find(c => c.id === fusionActor.id);
            if (char) {
              const updatedCardIds = [...(char.cardIds || []), newCard.id];
              updateCharacterStats(char.id, { cardIds: updatedCardIds });
            }
            setFusionNewCard(newCard);
            setFusionRevealCard(newCard);
            setFusionStep('revealing');
          }}
          onRevealComplete={() => {
            // Execute the card in combat
            if (fusionNewCard && fusionActor && combat) {
              const actor = combat.combatants.find(c => c.combatId === fusionActor.combatId);
              if (actor) {
                if (fusionNewCard.isAreaEffect) {
                  executeCardOnTarget(fusionNewCard, 'area');
                } else {
                  setSelectingTargetFor(fusionNewCard);
                }
              }
            }
            setFusionStep(null);
            setFusionSelectedCards([]);
            setFusionActor(null);
            setFusionRolls([]);
            setFusionSuccess(false);
            setFusionNewCard(null);
            setFusionRevealCard(null);
          }}
          onClose={() => {
            setFusionStep(null);
            setFusionSelectedCards([]);
            setFusionActor(null);
            setFusionRolls([]);
            setFusionSuccess(false);
            setFusionNewCard(null);
            setFusionRevealCard(null);
          }}
        />,
        document.body
      )}

      {/* ROLAGEM DE DADOS (fallback para ações sem carta) */}
      <DiceAnimation 
        isVisible={!!diceAnim?.isVisible} 
        result={diceAnim?.result || 0} 
        defenderResult={diceAnim?.defenderResult} 
        isSuccess={!!diceAnim?.isSuccess} 
        customLabel={diceAnim?.customLabel} 
        notation={diceAnim?.notation || '1d20'}
        individualRolls={diceAnim?.individualRolls || [diceAnim?.result || 0]}
        numSides={diceAnim?.numSides || 20}
        bonus={diceAnim?.bonus || 0}
        onComplete={() => setDiceAnim(null)} 
      />

      {/* MODAL CONFIGURAÇÃO DE COMBATENTE */}
      {setupCombatant && (
        <Modal title="Preparar Arena" onClose={() => setSetupCombatant(null)}>
           <CombatantSetupForm character={setupCombatant} onSubmit={(hp, aura, initiative, ammo) => addCombatantToCombatFinal(setupCombatant, hp, aura, initiative, ammo)} />
        </Modal>
      )}

      {/* MODAL ADICIONAR ITEM */}
      {editingItem && (
        <Modal title={editingItem.id ? "Editar Item" : "Novo Item"} onClose={() => setEditingItem(null)}>
           <ItemForm 
             initialData={editingItem} 
             onSubmit={handleSaveItem} 
             onDelete={(id) => removeItemFromCharacter(id)}
           />
        </Modal>
      )}

      {/* MODAL GERENCIAR CONDIÇÕES */}
      {managingConditionsCharId && characterForConditions && (
         <Modal title={`Condições de ${characterForConditions.name}`} onClose={() => setManagingConditionsCharId(null)}>
            <ConditionManager 
               conditions={characterForConditions.conditions}
               onSave={(newConditions) => {
                  if (characterForConditions.isCombatant) {
                      const newCombatants = combat!.combatants.map(c => 
                        c.combatId === managingConditionsCharId ? { ...c, conditions: newConditions } : c
                      );
                      DatabaseService.updateCombat({ ...combat!, combatants: newCombatants });
                      if (characterForConditions.realId) {
                         const masterExists = characters.some(c => c.id === characterForConditions.realId);
                         if (masterExists) {
                            DatabaseService.saveCharacter({ ...characters.find(c => c.id === characterForConditions.realId)!, conditions: newConditions });
                         }
                      }
                  } else {
                      updateCharacterStats(characterForConditions.realId, { conditions: newConditions });
                  }
               }}
            />
         </Modal>
      )}

      {/* MODAL SELECIONAR COMBATENTE */}
      {showAddCombatantModal && (
        <AddCombatantModal
          characters={characters}
          isCharInCombat={isCharInCombat}
          onSelect={char => { setShowAddCombatantModal(false); setSetupCombatant(char); }}
          onClose={() => setShowAddCombatantModal(false)}
          onNpcCode={charId => {
            const char = characters.find(c => c.id === charId);
            if (char) { setShowAddCombatantModal(false); setSetupCombatant(char); }
          }}
        />
      )}

      {/* MODAL ATRIBUIR HABILIDADE A PERSONAGEM */}
      {assignCardModal && (
        <AssignCardModal
          card={assignCardModal}
          characters={characters}
          onAssign={(charId, add) => {
            const char = characters.find(c => c.id === charId);
            if (!char) return;
            const newCardIds = add
              ? (char.cardIds.includes(assignCardModal.id) ? char.cardIds : [...char.cardIds, assignCardModal.id])
              : char.cardIds.filter(id => id !== assignCardModal.id);
            DatabaseService.saveCharacter({ ...char, cardIds: newCardIds });
          }}
          onClose={() => setAssignCardModal(null)}
        />
      )}

      {/* MODAL HISTÓRICO DE COMBATE */}
      {showHistoryModal && (
        <Modal title="Registros de Combate" onClose={() => setShowHistoryModal(false)}>
           <div className="space-y-4">
              {combat?.history.map((entry) => (
                 <div key={entry.id} className="bg-slate-900/80 border border-slate-800 p-6 rounded-[2rem] flex items-start gap-6">
                    <div className={`p-3 rounded-xl border ${entry.isSuccess ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400' : 'bg-rose-950/30 border-rose-500/50 text-rose-400'}`}>
                       {entry.isSuccess ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-start mb-2">
                          <p className="text-white font-extrabold uppercase italic text-sm">
                             {entry.actor} <span className="text-slate-500 text-[10px] not-italic font-bold mx-2">usou</span> {entry.cardName}
                          </p>
                          <span className="text-[10px] font-mono text-slate-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                       </div>
                       
                       <p className="text-slate-400 text-xs mb-3">Alvo: <span className="text-white font-bold">{entry.target}</span></p>
                       
                       <div className="flex gap-4">
                          <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                             Rolagem: <span className="text-amber-400 font-bold">{entry.roll}</span> {entry.dc ? `/ CD ${entry.dc}` : ''}
                          </div>
                          {entry.reactionRoll !== undefined && (
                             <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                                Reação: <span className="text-blue-400 font-bold">{entry.reactionRoll}</span>
                             </div>
                          )}
                          {entry.damageDealt !== undefined && entry.damageDealt > 0 && (
                             <div className="bg-rose-950/30 px-3 py-1 rounded-lg border border-rose-900/50 text-[10px] font-mono text-rose-400">
                                Dano: {entry.damageDealt}
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              ))}
              {(!combat?.history || combat.history.length === 0) && (
                 <p className="text-center text-slate-500 font-extrabold uppercase py-10 opacity-50">Nenhum registro encontrado</p>
              )}
           </div>
        </Modal>
      )}

      {/* MODAL GENÉRICO DE CONFIRMAÇÃO - via Portal para escapar stacking context */}
      {confirmModal && (
        <ConfirmPortal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* MODAL CONFIRMAÇÃO ENCERRAR COMBATE - via Portal */}
      {showEndCombatConfirm && (
        <ConfirmPortal
          message="Tem certeza que deseja encerrar o combate? Todos os combatentes serão removidos."
          onConfirm={confirmEndCombat}
          onCancel={() => setShowEndCombatConfirm(false)}
          icon={<XCircle className="w-10 h-10 text-rose-400" />}
          confirmLabel="Encerrar"
        />
      )}

            {/* MODAL GERENCIAR GRUPO JORNADA */}
      {isPartyModalOpen && (
        <Modal title="Gerenciar Grupo" onClose={() => setIsPartyModalOpen(false)}>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map(char => (
                <div key={char.id} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-6 ${char.isInJourney ? 'bg-amber-950/60 border-amber-500 shadow-[0_0_30px_rgba(212,168,83,0.2)]' : 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'}`} onClick={() => toggleJourneyCharacter(char)}>
                   <img src={char.icon || undefined} className="w-16 h-16 rounded-[1.2rem] object-cover" />
                   <div className="flex-1">
                      <h4 className="font-extrabold uppercase text-white italic">{char.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{char.isInJourney ? 'No Grupo' : 'Na Reserva'}</p>
                   </div>
                   {char.isInJourney && <Check className="w-6 h-6 text-amber-400" />}
                </div>
              ))}
              {characters.length === 0 && <p className="text-slate-500 uppercase font-black text-center col-span-full py-10">Nenhum personagem criado.</p>}
           </div>
        </Modal>
      )}

      {/* MODAL QUICK EDIT (HP/AURA) */}
      {quickEditChar && (
         <Modal title="Edição Rápida" onClose={() => setQuickEditChar(null)}>
             <QuickEditCharacter 
                 character={quickEditChar} 
                 onSave={(hp, aura, ammo) => {
                     const updates: any = { currentHp: hp, currentAura: aura };
                     if (ammo !== undefined) updates.currentAmmo = ammo;
                     updateCharacterStats(quickEditChar.id, updates);
                     setQuickEditChar(null);
                 }}
             />
         </Modal>
      )}

      {/* MODAL RECEITA (COZINHAR / FORJAR) */}
      {recipeModal && (() => {
        const isCook = recipeModal.type === 'cozinhar';
        const accentColor = isCook ? '#fb923c' : '#c084fc';
        const accentBorder = isCook ? 'rgba(234,88,12,0.4)' : 'rgba(168,85,247,0.4)';
        const accentBg = isCook ? 'rgba(234,88,12,0.15)' : 'rgba(168,85,247,0.15)';
        const data = editRecipeData;
        const setData = setEditRecipeData;
        const ingredients: RecipeIngredient[] = (data.ingredients as RecipeIngredient[]) || [];
        const addIngredient = () => setData(d => ({ ...d, ingredients: [...(d.ingredients || []), { itemName: '', quantity: 1 }] }));
        const updateIngredient = (i: number, field: keyof RecipeIngredient, val: any) =>
          setData(d => ({ ...d, ingredients: (d.ingredients || []).map((ing: any, idx: number) => idx === i ? { ...ing, [field]: val } : ing) }));
        const removeIngredient = (i: number) =>
          setData(d => ({ ...d, ingredients: (d.ingredients || []).filter((_: any, idx: number) => idx !== i) }));
        const handleSave = () => {
          if (!data.name?.trim() || !data.resultItemName?.trim() || !ingredients.length) {
            alert('Preencha nome da receita, item resultante, e pelo menos 1 ingrediente.'); return;
          }
          const recipe: Recipe = {
            id: recipeModal.mode === 'edit' && recipeModal.recipe ? recipeModal.recipe.id : Math.random().toString(36).substr(2, 9),
            type: recipeModal.type,
            name: data.name || '',
            description: data.description || '',
            resultItemName: data.resultItemName || '',
            resultQuantity: data.resultQuantity || 1,
            resultDescription: data.resultDescription || '',
            resultImage: data.resultImage || '',
            resultCategory: data.resultCategory || '',
            ingredients: ingredients.filter((ing: RecipeIngredient) => ing.itemName.trim()),
            craftingTime: data.craftingTime || '',
            difficulty: data.difficulty as any,
          };
          saveRecipe(recipe);
          setRecipeModal(null);
          setEditRecipeData({});
        };
        return (
          <Modal title={`${recipeModal.mode === 'new' ? 'Nova' : 'Editar'} Receita de ${isCook ? 'Culinária' : 'Forja'}`} onClose={() => { setRecipeModal(null); setEditRecipeData({}); }}>
            <div style={{ display:'flex', flexDirection:'column', gap:16, maxHeight:'70vh', overflowY:'auto', paddingRight:4 }}>
              {/* Basic info */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 }}>Nome da Receita *</label>
                  <input value={data.name || ''} onChange={e => setData(d => ({...d, name: e.target.value}))} placeholder="Ex: Ensopado Revigorante" style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${accentBorder}`, borderRadius:10, padding:'8px 12px', color:'#fff', fontSize:12, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 }}>Dificuldade</label>
                  <select value={data.difficulty || ''} onChange={e => setData(d => ({...d, difficulty: e.target.value as any}))} style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${accentBorder}`, borderRadius:10, padding:'8px 12px', color:'#fff', fontSize:12, outline:'none' }}>
                    <option value="">— Sem dificuldade —</option>
                    <option value="fácil">Fácil</option>
                    <option value="médio">Médio</option>
                    <option value="difícil">Difícil</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 }}>Tempo</label>
                  <input value={data.craftingTime || ''} onChange={e => setData(d => ({...d, craftingTime: e.target.value}))} placeholder="Ex: 30 min" style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${accentBorder}`, borderRadius:10, padding:'8px 12px', color:'#fff', fontSize:12, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 }}>Descrição</label>
                  <textarea value={data.description || ''} onChange={e => setData(d => ({...d, description: e.target.value}))} placeholder="Como preparar..." rows={2} style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:`1px solid ${accentBorder}`, borderRadius:10, padding:'8px 12px', color:'#fff', fontSize:11, outline:'none', resize:'vertical', boxSizing:'border-box' }} />
                </div>
              </div>

              {/* Result */}
              <div style={{ background: accentBg, border:`1px solid ${accentBorder}`, borderRadius:14, padding:14 }}>
                <p style={{ fontSize:10, fontWeight:800, color: accentColor, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Resultado</p>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 }}>Nome do Item Criado *</label>
                    <input value={data.resultItemName || ''} onChange={e => setData(d => ({...d, resultItemName: e.target.value}))} placeholder="Ex: Sopa Mágica" style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'8px 12px', color:'#fff', fontSize:12, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 }}>Quantidade</label>
                    <input type="number" min={1} value={data.resultQuantity ?? 1} onChange={e => setData(d => ({...d, resultQuantity: parseInt(e.target.value)||1}))} style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'8px 12px', color:'#fff', fontSize:12, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 }}>Categoria</label>
                    <input value={data.resultCategory || ''} onChange={e => setData(d => ({...d, resultCategory: e.target.value}))} placeholder="Ex: Comida, Arma..." style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'8px 12px', color:'#fff', fontSize:12, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 }}>Imagem (URL)</label>
                    <input value={data.resultImage || ''} onChange={e => setData(d => ({...d, resultImage: e.target.value}))} placeholder="https://..." style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'8px 12px', color:'#fff', fontSize:11, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 }}>Descrição do Item</label>
                    <input value={data.resultDescription || ''} onChange={e => setData(d => ({...d, resultDescription: e.target.value}))} placeholder="O que esse item faz..." style={{ width:'100%', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'8px 12px', color:'#fff', fontSize:12, outline:'none', boxSizing:'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <p style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'0.12em' }}>{isCook ? 'Ingredientes' : 'Materiais'}</p>
                  <button onClick={addIngredient} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background: accentBg, border:`1px solid ${accentBorder}`, borderRadius:8, color: accentColor, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                    <Plus style={{ width:11, height:11 }} /> Adicionar
                  </button>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {ingredients.map((ing: RecipeIngredient, i: number) => (
                    <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <input
                        value={ing.itemName}
                        onChange={e => updateIngredient(i, 'itemName', e.target.value)}
                        placeholder={isCook ? "Nome do ingrediente" : "Nome do material"}
                        list={`recipe-item-suggestions-${i}`}
                        style={{ flex:1, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:9, padding:'7px 10px', color:'#fff', fontSize:11, outline:'none', boxSizing:'border-box' }}
                      />
                      <datalist id={`recipe-item-suggestions-${i}`}>
                        {[...new Set(characters.flatMap(c => (c.items||[]).map(it => it.name)))].map(name => <option key={name} value={name} />)}
                      </datalist>
                      <input
                        type="number" min={1}
                        value={ing.quantity}
                        onChange={e => updateIngredient(i, 'quantity', parseInt(e.target.value)||1)}
                        style={{ width:60, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:9, padding:'7px 8px', color:'#fff', fontSize:12, outline:'none', textAlign:'center', boxSizing:'border-box' }}
                      />
                      <button onClick={() => removeIngredient(i)} style={{ padding:'7px 8px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#f87171', cursor:'pointer' }} className="hover:brightness-125">
                        <Trash2 style={{ width:12, height:12 }} />
                      </button>
                    </div>
                  ))}
                  {ingredients.length === 0 && <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', padding:'12px 0' }}>Nenhum {isCook ? 'ingrediente' : 'material'} adicionado</p>}
                </div>
              </div>

              {/* Save button */}
              <button onClick={handleSave} style={{ width:'100%', padding:'12px 0', background:`linear-gradient(135deg,${isCook?'rgba(234,88,12,0.7),rgba(180,60,5,0.9)':'rgba(168,85,247,0.6),rgba(109,40,217,0.8)'})`, border:`1px solid ${accentBorder}`, borderRadius:14, color:'#fff', fontWeight:800, fontSize:13, textTransform:'uppercase', letterSpacing:'0.12em', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                className="hover:brightness-110 transition-all">
                {isCook ? <ChefHat style={{ width:16, height:16 }} /> : <Hammer style={{ width:16, height:16 }} />}
                {recipeModal.mode === 'new' ? 'Criar Receita' : 'Salvar Alterações'}
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* MODAL RESULTADO DE CRAFTING */}
      {craftResult && (() => {
        const isCook = craftResult.recipe.type === 'cozinhar';
        return (
          <Modal title={isCook ? '🍳 Receita Preparada!' : '⚒️ Item Forjado!'} onClose={() => setCraftResult(null)}>
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              {craftResult.recipe.resultImage && (
                <img src={craftResult.recipe.resultImage} style={{ width:80, height:80, borderRadius:16, objectFit:'cover', margin:'0 auto 16px', border:`2px solid ${isCook?'rgba(234,88,12,0.5)':'rgba(168,85,247,0.5)'}`, boxShadow:`0 0 24px ${isCook?'rgba(234,88,12,0.3)':'rgba(168,85,247,0.3)'}` }} />
              )}
              <div style={{ fontSize:40, marginBottom:8 }}>{isCook ? '🍳' : '⚔️'}</div>
              <h3 style={{ fontSize:18, fontWeight:800, color:'#fff', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{craftResult.recipe.resultQuantity}× {craftResult.recipe.resultItemName}</h3>
              <p style={{ fontSize:12, color: isCook ? '#fb923c' : '#c084fc', fontWeight:700, marginBottom:16 }}>{craftResult.recipe.name}</p>
              {craftResult.recipe.resultDescription && <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.6, marginBottom:16 }}>{craftResult.recipe.resultDescription}</p>}
              <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:'10px 20px', marginBottom:20 }}>
                {craftResult.character.icon && <img src={craftResult.character.icon} style={{ width:28, height:28, borderRadius:8, objectFit:'cover' }} />}
                <span style={{ fontSize:12, fontWeight:700, color:'#86efac' }}>{craftResult.character.name} recebeu o item!</span>
              </div>
              <button onClick={() => setCraftResult(null)} style={{ padding:'10px 28px', background: isCook ? 'linear-gradient(135deg,rgba(234,88,12,0.7),rgba(180,60,5,0.9))' : 'linear-gradient(135deg,rgba(168,85,247,0.6),rgba(109,40,217,0.8))', border:'none', borderRadius:12, color:'#fff', fontWeight:700, fontSize:12, textTransform:'uppercase', letterSpacing:'0.1em', cursor:'pointer' }}>
                Ótimo!
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* UPGRADE PURCHASE RESULT MODAL */}
      {upgradePurchaseResult && (() => {
        const { offer, targetChar } = upgradePurchaseResult;
        const rarityConf2 = { common:'#94a3b8', uncommon:'#34d399', rare:'#818cf8', legendary:'#fbbf24' };
        const offerIcons2: Record<UpgradeOfferType, string> = { vitalidade:'❤', aura:'⚡', reroll:'🎲', par:'✌', trinca:'🔱', quadra:'♦', nova_carta:'🃏', desejo:'✨' };
        const rc = rarityConf2[offer.rarity];
        const isNovaCartaOrDesejo = offer.type === 'nova_carta' || offer.type === 'desejo';
        const isItem = ['par','trinca','quadra','reroll'].includes(offer.type);
        return (
          <Modal title="✦ Upgrade Adquirido!" onClose={() => setUpgradePurchaseResult(null)}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'8px 0' }}>
              <div style={{ width:72, height:72, borderRadius:18, background:`${rc}18`, border:`2px solid ${rc}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, boxShadow:`0 0 30px ${rc}44` }}>
                {offerIcons2[offer.type]}
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:20, fontWeight:900, color:'#fff', textTransform:'uppercase', letterSpacing:'0.06em' }}>{offer.label}</p>
                <p style={{ fontSize:11, color: rc, marginTop:3 }}>{offer.description}</p>
              </div>
              <div style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:12, padding:'10px 20px', textAlign:'center' }}>
                {offer.type === 'nova_carta'
                  ? <span style={{ fontSize:13, fontWeight:700, color:'#818cf8' }}>🃏 Abrindo criação de habilidade para {targetChar.name}...</span>
                  : offer.type === 'desejo'
                  ? <span style={{ fontSize:13, fontWeight:700, color:'#fbbf24' }}>✨ O desejo de {targetChar.name} será cumprido pelo Mestre!</span>
                  : isItem
                  ? <span style={{ fontSize:13, fontWeight:700, color:'#86efac' }}>✓ Adicionado ao inventário de {targetChar.name}!</span>
                  : <span style={{ fontSize:13, fontWeight:700, color:'#86efac' }}>✓ {targetChar.name} recebeu o upgrade!</span>
                }
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>Custo: {offer.finalPrice}🪙 · Saldo restante: {characterCurrencies[targetChar.id] ?? 0}🪙</div>
              <button onClick={() => setUpgradePurchaseResult(null)} style={{ padding:'10px 32px', background:'linear-gradient(135deg,rgba(16,185,129,0.5),rgba(5,150,105,0.7))', border:'1px solid rgba(16,185,129,0.4)', borderRadius:12, color:'#fff', fontWeight:700, fontSize:12, textTransform:'uppercase', letterSpacing:'0.1em', cursor:'pointer' }}>
                Excelente!
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* MODAIS E PROMPTS */}
      {editingCharacter && (
        <Modal title={editingCharacter.id ? "Editar Receptáculo" : "Criar Receptáculo"} onClose={() => setEditingCharacter(null)}>
           <CharacterForm cards={cards} initialData={editingCharacter} onSubmit={(char) => { saveCharacter(char); setEditingCharacter(null); }} onDelete={deleteCharacter} />
        </Modal>
      )}

      {editingCard && (
        <Modal title={editingCard.id ? "Editar Registro" : "Novo Registro"} onClose={() => setEditingCard(null)}>
           <CardForm initialData={editingCard} onSubmit={(card) => {
             // If card was opened from upgrade shop (nova_carta), assign to the character
             const assignId = (editingCard as any)._assignToCharId;
             // Generate ID for new card so we can assign it immediately
             const finalCard = card.id ? card : { ...card, id: Math.random().toString(36).substr(2, 9) };
             saveCard(finalCard);
             if (assignId && !editingCard.id) {
               const char = characters.find(c => c.id === assignId);
               if (char) {
                 saveCharacter({ ...char, cardIds: [...(char.cardIds||[]), finalCard.id] });
               }
             }
             setEditingCard(null);
           }} onDelete={deleteCard} />
        </Modal>
      )}

      {editingSeal && (
        <Modal title={editingSeal.id ? 'Editar Selo' : 'Novo Selo Arcano'} onClose={() => setEditingSeal(null)}>
          <SealForm
            initialData={editingSeal.id ? editingSeal : undefined}
            characters={characters}
            cards={cards}
            onSubmit={(seal) => { saveSeal(seal); setEditingSeal(null); }}
            onDelete={deleteSeal}
          />
        </Modal>
      )}

      {/* Seal Ritual Animation */}
      {sealRitualAnim && (
        <SealRitualOverlay
          seal={sealRitualAnim.seal}
          effects={sealRitualAnim.effects}
          onDone={() => setSealRitualAnim(null)}
        />
      )}

      {/* Item Use Animation */}
      {itemUseAnim && (
        <ItemUseAnimation item={itemUseAnim} onDone={() => setItemUseAnim(null)} />
      )}

      {/* Inventory Panel for Journey characters */}
      {openInventoryCharId && (() => {
        const char = characters.find(c => c.id === openInventoryCharId);
        if (!char) return null;
        return createPortal(
          <div style={{
            position:'fixed', inset:0, zIndex:99990,
            background:'rgba(5,8,20,0.92)', backdropFilter:'blur(20px)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:24,
          }} onClick={(e) => { if (e.target === e.currentTarget) setOpenInventoryCharId(null); }}>
            <div style={{
              background:'rgba(18,22,38,0.98)', border:'1px solid rgba(212,168,83,0.3)',
              borderRadius:32, overflow:'hidden', width:'100%', maxWidth:720, maxHeight:'85vh',
              display:'flex', flexDirection:'column',
              boxShadow:'0 40px 120px rgba(0,0,0,0.8), 0 0 60px rgba(212,168,83,0.1)',
            }}>
              {/* Header */}
              <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(24,20,12,0.9)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <img src={char.icon || undefined} style={{ width:48, height:48, borderRadius:16, objectFit:'cover', border:'2px solid rgba(212,168,83,0.5)' }} />
                  <div>
                    <h3 style={{ fontSize:18, fontWeight:700, color:'#fdf0cc', textTransform:'uppercase', fontStyle:'italic' }}>{char.name}</h3>
                    <div style={{ display:'flex', gap:10, marginTop:2 }}>
                      <span style={{ fontSize:9, color:'#f87171', fontFamily:"'JetBrains Mono',monospace" }}>❤ {char.currentHp}/{char.maxHp}</span>
                      <span style={{ fontSize:9, color:'#93c5fd', fontFamily:"'JetBrains Mono',monospace" }}>⚡ {char.currentAura}/{char.maxAura}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => { setSelectedInventoryCharId(char.id); setEditingItem({} as any); }}
                    style={{ padding:'8px 16px', background:'linear-gradient(135deg,#c9983a,#8a6520)', border:'none', borderRadius:10, color:'#120f08', fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    <Plus style={{width:12,height:12}} /> Adicionar
                  </button>
                  <button onClick={() => setOpenInventoryCharId(null)}
                    style={{ width:36, height:36, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#94a3b8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <X style={{width:16,height:16}} />
                  </button>
                </div>
              </div>
              {/* Items grid */}
              <div style={{ flex:1, overflowY:'auto', padding:20 }}>
                {(!char.items || char.items.length === 0) ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, opacity:0.3 }}>
                    <PackageOpen style={{ width:48, height:48, color:'#475569', marginBottom:12 }} />
                    <p style={{ color:'#475569', fontWeight:700, textTransform:'uppercase', fontSize:11 }}>Inventário vazio</p>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
                    {char.items.map((item: Item) => (
                      <div key={item.id} className="group" style={{
                        background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.06)',
                        borderRadius:16, overflow:'hidden', position:'relative',
                      }}>
                        {/* Image */}
                        <div style={{ position:'relative', aspectRatio:'1', background:'rgba(0,0,0,0.5)', overflow:'hidden' }}>
                          {item.image ? (
                            <img src={item.image} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                          ) : (
                            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>
                              {(item.category||'').toLowerCase().includes('arma') ? '⚔️' : (item.category||'').toLowerCase().includes('consumí') ? '🧪' : '📦'}
                            </div>
                          )}
                          <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,rgba(0,0,0,0.7) 0%,transparent 50%)' }} />
                          {/* Actions */}
                          <div className="group-hover:opacity-100" style={{ position:'absolute', top:6, right:6, display:'flex', gap:4, opacity:0, transition:'opacity 0.2s' }}>
                            <button onClick={() => { setSelectedInventoryCharId(char.id); setEditingItem(item); }}
                              style={{ width:26, height:26, background:'rgba(0,0,0,0.8)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', cursor:'pointer' }}>
                              <Edit3 style={{width:11,height:11}} />
                            </button>
                          </div>
                          {(item.quantity || 0) > 1 && (
                            <div style={{ position:'absolute', bottom:6, right:6, background:'rgba(180,140,40,0.9)', borderRadius:6, padding:'1px 6px', fontSize:10, fontWeight:700, color:'white' }}>×{item.quantity}</div>
                          )}
                          {/* Use button */}
                          {item.usableInCombat && (
                            <button onClick={() => {
                              setItemUseAnim(item);
                              if (item.consumeOnUse) {
                                const newQty = (item.quantity || 1) - 1;
                                const updatedItems = newQty > 0
                                  ? char.items.map((i: Item) => i.id === item.id ? {...i, quantity: newQty} : i)
                                  : char.items.filter((i: Item) => i.id !== item.id);
                                updateCharacterStats(char.id, { items: updatedItems });
                              }
                            }} style={{
                              position:'absolute', bottom:6, left:6,
                              padding:'3px 8px', background:'rgba(34,197,94,0.85)', border:'none',
                              borderRadius:6, fontSize:8, fontWeight:700, color:'white', cursor:'pointer',
                              textTransform:'uppercase', letterSpacing:'0.1em',
                            }}>Usar</button>
                          )}
                        </div>
                        {/* Info */}
                        <div style={{ padding:'8px 10px' }}>
                          <h4 style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', fontStyle:'italic', color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</h4>
                          {item.category && <p style={{ fontSize:8, color:'#475569', textTransform:'uppercase', marginTop:2 }}>{item.category}</p>}
                          {/* Qty controls */}
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(0,0,0,0.4)', borderRadius:6, padding:'1px 3px' }}>
                              <button onClick={() => {
                                const newQty = Math.max(1,(item.quantity||1)-1);
                                updateCharacterStats(char.id, { items: char.items.map((i: Item) => i.id===item.id ? {...i,quantity:newQty} : i) });
                              }} style={{ width:16,height:16,background:'rgba(255,255,255,0.05)',border:'none',borderRadius:4,color:'#64748b',cursor:'pointer',fontSize:11,fontWeight:700 }}>−</button>
                              <span style={{ fontSize:11, fontWeight:700, color:'#d4a853', fontFamily:"'JetBrains Mono',monospace", minWidth:18, textAlign:'center' }}>{item.quantity||1}</span>
                              <button onClick={() => {
                                const newQty = (item.quantity||1)+1;
                                updateCharacterStats(char.id, { items: char.items.map((i: Item) => i.id===item.id ? {...i,quantity:newQty} : i) });
                              }} style={{ width:16,height:16,background:'rgba(255,255,255,0.05)',border:'none',borderRadius:4,color:'#64748b',cursor:'pointer',fontSize:11,fontWeight:700 }}>+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {isReactionPrompt && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/95 p-6 backdrop-blur-[40px] animate-in fade-in duration-300">
           <div className={`bg-slate-900 border-8 border-amber-600 rounded-[5rem] p-16 max-w-5xl w-full text-center space-y-10 animate-in zoom-in shadow-[0_0_200px_rgba(212,168,83,0.3)] relative overflow-hidden flex flex-col max-h-[90vh]`}>
              <div className="flex flex-col items-center">
                 <ShieldAlert className="w-20 h-20 text-amber-500 animate-pulse drop-shadow-[0_0_40px_rgba(212,168,83,1)] mb-6" />
                 <h2 className="text-4xl font-extrabold uppercase italic text-white mb-2">Reação Detectada</h2>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">O Alvo {isReactionPrompt.target.name} pode reagir!</p>
              </div>

              <div className="bg-black/40 p-8 rounded-[3rem] border border-slate-800 text-left">
                 <p className="text-[10px] text-slate-500 font-extrabold uppercase mb-2">Ação Hostil</p>
                 <div className="flex items-center gap-4">
                    <span className="text-rose-500 font-black text-xl italic">{isReactionPrompt.attacker.name}</span>
                    <span className="text-slate-600 text-xs">usou</span>
                    <span className="text-white font-black text-xl italic">{isReactionPrompt.activeCard.name}</span>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scroll pr-2">
                 <p className="text-left text-[10px] text-slate-500 font-extrabold uppercase mb-4 sticky top-0 bg-slate-900 z-10 py-2">Escolha uma reação disponível</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isReactionPrompt.availableReactions.map(reactionCard => (
                       <button 
                          key={reactionCard.id}
                          onClick={() => {
                             const { target, attacker, activeCard } = isReactionPrompt;
                             const ncs = [...combat!.combatants];
                             const idx = ncs.findIndex(c => c.combatId === target.combatId);
                             
                             if (idx !== -1) {
                                ncs[idx].currentAura = Math.max(0, ncs[idx].currentAura - reactionCard.auraCost);
                                updateCharacterStats(ncs[idx].id, { currentAura: ncs[idx].currentAura });
                             }

                             const reactRoll = rollDice(reactionCard.diceRoll, 0).total;
                             setIsReactionPrompt(null);
                             finalizeAction(activeCard, target, attacker, ncs, reactRoll, reactionCard);
                          }}
                          className={`flex items-center gap-4 p-4 rounded-[2rem] border-2 bg-slate-900/60 hover:bg-amber-950/40 border-slate-700 hover:border-amber-500 transition-all text-left group`}
                       >
                          <img src={reactionCard.image || undefined} className="w-12 h-12 rounded-xl object-cover border border-slate-600 group-hover:border-amber-400" />
                          <div className="flex-1">
                             <h4 className="text-white font-extrabold uppercase italic text-sm group-hover:text-amber-300">{reactionCard.name}</h4>
                             <span className="text-[10px] text-slate-500 font-mono">{reactionCard.diceRoll} • {reactionCard.auraCost} Aura</span>
                          </div>
                       </button>
                    ))}
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                 <button onClick={() => { setIsReactionPrompt(null); finalizeAction(isReactionPrompt.activeCard, isReactionPrompt.target, isReactionPrompt.attacker, combat!.combatants, undefined, undefined); }} className="w-full py-6 bg-slate-900/80 hover:bg-rose-950/30 rounded-[2.5rem] font-extrabold uppercase text-slate-500 hover:text-rose-500 border-2 border-slate-800 hover:border-rose-900/50 transition-all text-xs tracking-widest">
                    Não Reagir (Aceitar Destino)
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #5a4010; border-radius: 12px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #c9983a; }
        .glass-panel { background: rgba(24,28,40,0.85); backdrop-filter: blur(20px); }
        .nav-glow { box-shadow: 0 1px 0 rgba(180,140,40,0.15), 0 4px 40px rgba(0,0,0,0.6); }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .snap-x { scroll-snap-type: x mandatory; }
        .grid-cell:hover { background: rgba(180,140,40,0.06) !important; }
        @keyframes defeated-pulse {
  0%,100% { opacity:1; }
  50% { opacity:0.55; }
}
@keyframes crit-explosion {
  0% { transform:scale(0.1); opacity:0; }
  40% { opacity:1; }
  100% { transform:scale(6); opacity:0; }
}
@keyframes fumble-spin {
  0% { transform:rotate(0) scale(1); }
  50% { transform:rotate(180deg) scale(0.3); opacity:0.4; }
  100% { transform:rotate(360deg) scale(1); opacity:0; }
}
@keyframes turnBannerSlide {
          0% { opacity:0; transform: translateY(-60px) scaleX(0.6); }
          12% { opacity:1; transform: translateY(0px) scaleX(1); }
          72% { opacity:1; transform: translateY(0px) scaleX(1); }
          100% { opacity:0; transform: translateY(40px) scaleX(0.8); }
        }
        @keyframes danger-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        .animate-danger { animation: danger-pulse 1.5s ease-in-out infinite; }
        .anim-fade { animation: fadeIn 0.3s ease; }
        .anim-fade-up { animation: fadeUp 0.4s ease forwards; }
        .anim-fade-up-d1 { animation: fadeUp 0.4s ease 0.08s forwards; opacity:0; }
        .anim-scale-in { animation: scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes turn-pulse { 0%,100%{transform:scale(1);opacity:0.7;} 50%{transform:scale(1.1);opacity:1;} }
        @keyframes bar-fill { from{width:0} }
        .animate-bar-fill { animation: bar-fill 0.8s ease; }
        .animate-impact { animation: impactAnim 0.4s ease; }
        @keyframes impactAnim { 0%{transform:scale(1.25) rotate(3deg);filter:brightness(1.8);} 50%{transform:scale(0.95);} 100%{transform:scale(1);filter:brightness(1);} }
        @keyframes statPopup { 0%{opacity:1;transform:translateX(-50%) translateY(0) scale(1);} 60%{opacity:1;transform:translateX(-50%) translateY(-20px) scale(1.15);} 100%{opacity:0;transform:translateX(-50%) translateY(-36px) scale(0.9);} }
        input[type=range] { -webkit-appearance:none; width:100%; height:4px; background:rgba(180,140,40,0.2); border-radius:99px; outline:none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; background:linear-gradient(135deg,#c9983a,#f0c060); border-radius:50%; cursor:pointer; box-shadow:0 0 8px rgba(201,152,58,0.6); }
        @keyframes char-hp-danger {
          0%,100% { box-shadow: 0 0 8px rgba(239,68,68,0.55), 0 0 18px rgba(239,68,68,0.25); border-color: rgba(239,68,68,0.75); }
          50%     { box-shadow: 0 0 20px rgba(239,68,68,1),   0 0 40px rgba(239,68,68,0.55); border-color: rgba(239,68,68,1); }
        }
        @keyframes char-tremble {
          0%   { transform: translate(0,0) rotate(0deg); }
          10%  { transform: translate(-1.5px,1px) rotate(-0.5deg); }
          20%  { transform: translate(1.5px,-1px) rotate(0.5deg); }
          30%  { transform: translate(-1px,1.5px) rotate(-0.4deg); }
          40%  { transform: translate(1px,-1.5px) rotate(0.4deg); }
          50%  { transform: translate(-1.5px,0) rotate(-0.5deg); }
          60%  { transform: translate(1.5px,1px) rotate(0.3deg); }
          70%  { transform: translate(-1px,-1px) rotate(-0.4deg); }
          80%  { transform: translate(1px,1.5px) rotate(0.35deg); }
          90%  { transform: translate(-1.5px,-1.5px) rotate(-0.3deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }

        /* ── TURN SYSTEM ANIMATIONS ── */
        @keyframes turnFlashSweep {
          0%   { opacity:0; transform:translateX(-100%); }
          30%  { opacity:1; }
          70%  { opacity:1; }
          100% { opacity:0; transform:translateX(100%); }
        }
        @keyframes turnCardPop {
          0%   { opacity:0; transform:scale(0.82) translateY(-8px); }
          60%  { opacity:1; transform:scale(1.04) translateY(0); }
          100% { transform:scale(1) translateY(0); }
        }
        @keyframes roundBounceIn {
          0%   { opacity:0; transform:scale(0.6) translateY(-12px); }
          65%  { opacity:1; transform:scale(1.12) translateY(2px); }
          100% { transform:scale(1) translateY(0); }
        }
        @keyframes turnActorSlide {
          0%   { opacity:0; transform:translateX(24px); }
          60%  { opacity:1; transform:translateX(-2px); }
          100% { transform:translateX(0); }
        }
        @keyframes hudSlideIn {
          0%   { opacity:0; transform:translateY(20px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes hudTokenIn {
          0%   { opacity:0; transform:scale(0.7) rotate(-8deg); }
          65%  { opacity:1; transform:scale(1.05) rotate(1deg); }
          100% { transform:scale(1) rotate(0deg); }
        }
        @keyframes hudNameIn {
          0%   { opacity:0; transform:translateX(-50%) translateY(-6px); }
          100% { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        @keyframes hudStatsIn {
          0%   { opacity:0; transform:translateX(-16px); }
          100% { opacity:1; transform:translateX(0); }
        }
        @keyframes hudSideIn {
          0%   { opacity:0; transform:translateX(16px); }
          100% { opacity:1; transform:translateX(0); }
        }
        @keyframes condIn {
          0%   { opacity:0; transform:scale(0.7); }
          100% { opacity:1; transform:scale(1); }
        }
        @keyframes barShimmer {
          0%,100% { opacity:0; transform:translateX(-100%); }
          50% { opacity:1; transform:translateX(100%); }
        }
        .timer-urgent { animation: timer-urgent-pulse 0.6s ease-in-out infinite !important; }
        @keyframes timer-urgent-pulse {
          0%,100% { box-shadow:0 0 0 rgba(239,68,68,0); border-color:rgba(239,68,68,0.35); }
          50% { box-shadow:0 0 16px rgba(239,68,68,0.6); border-color:rgba(239,68,68,0.8); }
        }

        /* ── COMBAT MOBILE MODE ── */
        .combat-mobile-mode {
          --mobile-scale: 1.25;
        }
        /* Scale up the command list and combat grid area */
        .combat-mobile-mode .combatant-token { transform: scale(1.2); transform-origin: top center; }
        /* Make buttons and interactive elements larger */
        .combat-mobile-mode button { min-height: 34px; }
        /* Scale initiative strip text */
        .combat-mobile-mode [data-initiative-name] { font-size: 13px !important; }
        /* Larger HP/Aura values */
        .combat-mobile-mode .combat-stat-value { font-size: 18px !important; }
        /* Combat mobile: scale up the entire bottom action area */
        .combat-mobile-mode .combat-action-area {
          transform: scale(1.12);
          transform-origin: bottom center;
        }
      `}</style>
    </div>
  );
};

export default App;